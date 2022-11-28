;; @contract DIKO Stake Pool
;; @version 2.0

;; Traits
;; TODO: update address
(use-trait ft-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)
;; Old trait, needed to not break governance contract
(impl-trait .arkadiko-stake-pool-diko-trait-v1.stake-pool-diko-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

;; Errors
(define-constant ERR-NOT-AUTHORIZED u110001)
(define-constant ERR-REWARDS-CALC (err u110002))
(define-constant ERR-INSUFFICIENT-STAKE (err u110003))
(define-constant ERR-WRONG-REGISTRY (err u110004))
(define-constant ERR-WRONG-TOKEN (err u110005))

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

;; Variables
(define-data-var total-staked uint u0) ;; DIKO, esDIKO & MultiplierPoints
(define-data-var esdiko-block-rewards uint u1000000) ;; TODO: set for mainnet

(define-data-var revenue-initialised bool false) 
(define-data-var revenue-epoch-length uint u1008) 
(define-data-var revenue-epoch-end uint u0) 
(define-data-var revenue-block-rewards uint u0) 
(define-data-var revenue-next-total uint u0) 

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

;; Track reward info for token
(define-map rewards 
  { token: principal } 
  {
    last-reward-increase-block: uint,
    cumm-reward-per-stake: uint
  }
)

;; Track ammount and cummulative reward for staker
(define-map stakes 
  { staker: principal } 
  {
    last-update-block: uint,
    amount: uint,
    diko: uint,
    esdiko: uint,
    points: uint 
  }
)

;; Track cummulative rewards per staker and token
(define-map stake-rewards 
  { 
    staker: principal,
    token: principal
  } 
  {
    cumm-reward-per-stake: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

;; @desc get reward info
(define-read-only (get-reward-of (token principal))
  (default-to
    { last-reward-increase-block: u0, cumm-reward-per-stake: u0 }
    (map-get? rewards { token: token })
  )
)

;; @desc get staker info
(define-read-only (get-stake-of (staker principal))
  (default-to
    { last-update-block: u0, amount: u0, diko: u0, esdiko: u0, points: u0 }
    (map-get? stakes { staker: staker })
  )
)

;; @desc get staker info
(define-read-only (get-stake-rewards-of (staker principal) (token principal))
  (default-to
    { cumm-reward-per-stake: u0 }
    (map-get? stake-rewards { staker: staker, token: token })
  )
)

;; @desc get variable total-staked
(define-read-only (get-total-staked)
  (var-get total-staked)
)

;; @desc get esDIKO rewards per block
(define-read-only (get-esdiko-block-rewards)
  (var-get esdiko-block-rewards)
)

;; @desc get revenue info
(define-read-only (get-revenue-info)
  {
    revenue-epoch-length: (var-get revenue-epoch-length),
    revenue-epoch-end: (var-get revenue-epoch-end),
    revenue-block-rewards: (var-get revenue-block-rewards),
    revenue-next-total: (var-get revenue-next-total)
  }
)

;; @desc needed in the governance contract
(define-read-only (diko-stdiko-ratio)
  (ok u1000000)
)

;; ---------------------------------------------------------
;; Stake & Unstake
;; ---------------------------------------------------------

;; @desc stake tokens in the pool
;; @param token; token to stake
;; @param amount; amount to stake
;; @post uint; returns amount of tokens staked
(define-public (stake (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
  )
    (asserts! (or (is-eq (contract-of token) .arkadiko-token) (is-eq (contract-of token) .escrowed-diko-token)) ERR-WRONG-TOKEN)

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    ;; It also makes sure the multiplier points are credited to the staker
    (try! (claim-pending-rewards))

    (let (
      (updated-stakes (get-stake-of staker))
    )
      ;; Update total stake, increase cummulative rewards and update revenue
      (var-set total-staked (+ (var-get total-staked) amount))
      (try! (increase-cumm-reward-per-stake))
      (try! (update-revenue))

      ;; Transfer tokens and update map
      (try! (contract-call? token transfer amount staker (as-contract tx-sender) none))
      (if (is-eq (contract-of token) .arkadiko-token)
        (map-set stakes { staker: staker } (merge updated-stakes { 
          amount: (+ (get amount updated-stakes) amount),
          diko: (+ (get diko updated-stakes) amount) 
        }))
        (map-set stakes { staker: staker } (merge updated-stakes { 
          amount: (+ (get amount updated-stakes) amount),
          esdiko: (+ (get esdiko updated-stakes) amount) 
        }))
      )

      ;; Notify vesting
      ;; TODO: make contract dynamic
      (try! (contract-call? .arkadiko-vest-esdiko-v1-1 update-staking staker (get amount (get-stake-of staker))))

      (ok amount)
    )
  )
)

;; @desc unstake tokens in the pool
;; @param token; token to unstake
;; @param amount; amount to unstake
;; @post uint; returns amount of tokens unstaked
(define-public (unstake (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
  )
    (asserts! (or (is-eq (contract-of token) .arkadiko-token) (is-eq (contract-of token) .escrowed-diko-token)) ERR-WRONG-TOKEN)
    (asserts! (or
      (and (is-eq (contract-of token) .arkadiko-token) (>= (get diko (get-stake-of staker)) amount))
      (and (is-eq (contract-of token) .escrowed-diko-token) (>= (get esdiko (get-stake-of staker)) amount))
    ) ERR-INSUFFICIENT-STAKE)

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    ;; It also makes sure the multiplier points are credited to the staker
    (try! (claim-pending-rewards))

    (let (
      ;; Calculate points to burn
      (updated-stakes (get-stake-of staker))
      (points-to-burn (/ (* (/ (* amount u1000000) (+ (get diko updated-stakes) (get esdiko updated-stakes))) (get points updated-stakes)) u1000000))
    )
      ;; Update total stake, increase cummulative rewards and update revenue
      (var-set total-staked (- (var-get total-staked) amount points-to-burn))
      (try! (increase-cumm-reward-per-stake))
      (try! (update-revenue))

      ;; Transfer tokens and update map
      (try! (as-contract (contract-call? token transfer amount tx-sender staker none)))
      (if (is-eq (contract-of token) .arkadiko-token)
        (map-set stakes { staker: staker } (merge updated-stakes { 
          amount: (- (get amount updated-stakes) amount points-to-burn),
          diko: (- (get diko updated-stakes) amount),
          points: (- (get points updated-stakes) points-to-burn)
        }))
        (map-set stakes { staker: staker } (merge updated-stakes { 
          amount: (- (get amount updated-stakes) amount points-to-burn),
          esdiko: (- (get esdiko updated-stakes) amount),
          points: (- (get points updated-stakes) points-to-burn)
        }))
      )

      ;; Notify vesting
      ;; TODO: make contract dynamic
      (try! (contract-call? .arkadiko-vest-esdiko-v1-1 update-staking staker (get amount (get-stake-of staker))))

      (ok amount)
    )    
  )
)

;; ---------------------------------------------------------
;; User rewards
;; ---------------------------------------------------------

;; @desc get amount of pending rewards for staker
;; @param staker; staker to get pending rewards for
;; @post tuple; returns pending rewards
(define-read-only (get-pending-rewards (staker principal))
  (let (
    (usda-rewards (unwrap-panic (get-pending-rewards-helper staker .usda-token)))
    (esdiko-rewards (unwrap-panic (get-pending-rewards-helper staker .escrowed-diko-token)))
    (point-rewards (calculate-multiplier-points staker))
  )
    (ok {
      usda: usda-rewards,
      esdiko: esdiko-rewards,
      point: point-rewards
    })
  )
)

;; @desc get amount of pending rewards for given staker and token
;; @param staker; staker to get pending rewards for
;; @param token; reward token
;; @post uint; returns pending rewards
(define-read-only (get-pending-rewards-helper (staker principal) (token principal))
  (let (
    (stake-amount (get amount (get-stake-of staker)))
    (current-cumm-reward (get cumm-reward-per-stake (get-reward-of token)))
    (user-cumm-reward (get cumm-reward-per-stake (get-stake-rewards-of staker token)))
    (amount-owed-per-token (- current-cumm-reward user-cumm-reward))
    (rewards-decimals (* stake-amount amount-owed-per-token))
    (rewards-result (/ rewards-decimals u1000000))
  )
    (ok rewards-result)
  )
)

;; @desc claim all pending rewards
;; @post uint; returns claimed rewards
(define-public (claim-pending-rewards)
  (let (
    (staker tx-sender)
    (current-stakes (get-stake-of staker))
    (added-points (calculate-multiplier-points staker))
    (new-points (+ added-points (get points current-stakes)))
  )
    (try! (increase-cumm-reward-per-stake))
    (try! (update-revenue))
    (try! (claim-pending-rewards-helper .escrowed-diko-token))
    (try! (claim-pending-rewards-helper .usda-token))

    ;; Update last-block and points to reflect added points
    ;; Update total-staked with points added
    (map-set stakes { staker: staker } (merge current-stakes { last-update-block: block-height, amount: (+ (get amount current-stakes) added-points), points: new-points }))
    (var-set total-staked (+ (var-get total-staked) added-points))

    (ok true)
  )
)

;; Claim pending rewards for given token
(define-private (claim-pending-rewards-helper (token <ft-trait>))
  (let (
    (staker tx-sender)
    (pending-rewards (unwrap! (get-pending-rewards-helper staker (contract-of token)) ERR-REWARDS-CALC))
    (stake-of (get-stake-of staker))
  )
    (asserts! (>= pending-rewards u1) (ok u0))

    (try! (as-contract (contract-call? token transfer pending-rewards tx-sender staker none)))
    (map-set stake-rewards { staker: staker, token: (contract-of token) } { cumm-reward-per-stake: (get cumm-reward-per-stake (get-reward-of (contract-of token))) })

    (ok pending-rewards)
  )
)

;; ---------------------------------------------------------
;; Multiplier points
;; ---------------------------------------------------------

;; @desc get pending multiplier points (100% APR)
;; @param staker; the staker
;; @post uint; returns pending points
(define-read-only (calculate-multiplier-points (staker principal))
  (let (
    (current-stakes (get-stake-of staker))
    (total-tokens (+ (get diko current-stakes) (get esdiko current-stakes)))
    (last-update (get last-update-block current-stakes))
    (block-diff (- block-height last-update))
    (reward-per-block (/ (* total-tokens u1000000) (* u144 u365)))
  )
    (asserts! (> total-tokens u0) u0)
    (asserts! (> block-diff u0) u0)

    (/ (* block-diff reward-per-block) u1000000)
  )
)

;; ---------------------------------------------------------
;; Cummulative rewards
;; ---------------------------------------------------------

;; @desc increase cummulative rewards per stake for all reward tokens
;; @post uint; new cummulative rewards per stake
(define-public (increase-cumm-reward-per-stake)
  (begin
    (try! (increase-cumm-esdiko-reward-per-stake))
    (unwrap-panic (increase-cumm-usda-reward-per-stake))
    (ok true)
  )
)

;; @desc increase cummulative rewards per stake for esDIKO
;; @post uint; the cummulative rewards per stake
(define-public (increase-cumm-esdiko-reward-per-stake)
  (let (
    (current-total-staked (var-get total-staked))
    (current-cumm-reward-per-stake (get cumm-reward-per-stake (get-reward-of .escrowed-diko-token))) 
  )
    (asserts! (> block-height (get last-reward-increase-block (get-reward-of .escrowed-diko-token))) (ok current-cumm-reward-per-stake))

    (if (is-eq current-total-staked u0)
      (begin
        (map-set rewards { token: .escrowed-diko-token } { cumm-reward-per-stake: u0, last-reward-increase-block: block-height})
        (ok u0)
      )
      (let (
        (block-diff (- block-height (get last-reward-increase-block (get-reward-of .escrowed-diko-token))))
        (total-rewards-to-distribute (* (var-get esdiko-block-rewards) block-diff))
        (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) current-total-staked))
        (new-cumm-reward-per-stake (+ current-cumm-reward-per-stake reward-added-per-token))
      )
        ;; Mint esDIKO for this contract
        (try! (as-contract (contract-call? .arkadiko-dao mint-token .escrowed-diko-token total-rewards-to-distribute tx-sender)))
        (map-set rewards { token: .escrowed-diko-token } { cumm-reward-per-stake: new-cumm-reward-per-stake, last-reward-increase-block: block-height})
        (ok new-cumm-reward-per-stake)
      )
    )
  )
)

;; @desc increase cummulative rewards per stake for USDA
;; @post uint; the cummulative rewards per stake
(define-public (increase-cumm-usda-reward-per-stake)
  (let (
    (current-total-staked (var-get total-staked))
    (current-cumm-reward-per-stake (get cumm-reward-per-stake (get-reward-of .usda-token))) 
    (last-increase-block (get last-reward-increase-block (get-reward-of .usda-token)))
    (block-end (if (> block-height (var-get revenue-epoch-end))
      (var-get revenue-epoch-end)
      block-height
    ))
    (block-diff (- block-end last-increase-block))
  )
    (asserts! (> block-end last-increase-block) (ok current-cumm-reward-per-stake))
    (asserts! (> current-total-staked u0) (ok current-cumm-reward-per-stake))

    (let (
      (total-rewards-to-distribute (* (var-get revenue-block-rewards) block-diff))
      (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) current-total-staked))
      (new-cumm-reward-per-stake (+ current-cumm-reward-per-stake reward-added-per-token))
    )
      (map-set rewards { token: .usda-token } { cumm-reward-per-stake: new-cumm-reward-per-stake, last-reward-increase-block: block-end})
      (ok new-cumm-reward-per-stake)
    )
  )
)

;; ---------------------------------------------------------
;; Revenue
;; ---------------------------------------------------------

;; @desc update revenue info
;; @post bool; always true
(define-public (update-revenue)
  (begin
    ;; Update vars if epoch ended
    (if (> block-height (var-get revenue-epoch-end))
      (begin
        (var-set revenue-block-rewards (/ (var-get revenue-next-total) (var-get revenue-epoch-length)))
        (var-set revenue-epoch-end (+ (var-get revenue-epoch-end) (var-get revenue-epoch-length)))
        (var-set revenue-next-total u0)
      )
      false
    )

    ;; Transfer USDA revenue from Freddie to this contract
    (let (
      (usda-balance (unwrap-panic (contract-call? .usda-token get-balance .arkadiko-freddie-v1-1)))
    )
      (if (> usda-balance u0)
        (begin
          (try! (contract-call? .arkadiko-dao burn-token .usda-token usda-balance .arkadiko-freddie-v1-1))
          (try! (contract-call? .arkadiko-dao mint-token .usda-token usda-balance .arkadiko-stake-pool-diko-v2-1))
          (var-set revenue-next-total (+ (var-get revenue-next-total) usda-balance))
        )
        false
      )
    )

    ;; Initialise - start first epoch with revenue just added
    (if (var-get revenue-initialised)
      false
      (begin
        (var-set revenue-block-rewards (/ (var-get revenue-next-total) (var-get revenue-epoch-length)))
        (var-set revenue-epoch-end (+ block-height (var-get revenue-epoch-length)))
        (var-set revenue-next-total u0)
        (var-set revenue-initialised true)
      )
    )

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; @desc update revenue epoch length
;; @post bool; epoch length
(define-public (set-revenue-epoch-length (length uint))
  (begin 
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set revenue-epoch-length length)
    (ok length)
  )
)

;; @desc update esDIKO rewards per block
;; @post bool; rewards per block
(define-public (set-esdiko-block-rewards (block-rewards uint))
  (begin 
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set esdiko-block-rewards block-rewards)
    (ok block-rewards)
  )
)
