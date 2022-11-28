;; @contract DIKO Stake Pool
;; @version 2.0

;; Traits
;; TODO: update address
(use-trait ft-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)
(use-trait stake-registry-trait .arkadiko-stake-registry-trait-v1.stake-registry-trait)
;; Old trait, needed to not break governance contract
(impl-trait .arkadiko-stake-pool-diko-trait-v1.stake-pool-diko-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

;; Errors
(define-constant ERR-REWARDS-CALC (err u110002))
(define-constant ERR-INSUFFICIENT-STAKE (err u110003))
(define-constant ERR-WRONG-REGISTRY (err u110004))
(define-constant ERR-WRONG-TOKEN (err u110005))

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

;; Variables
(define-data-var total-staked uint u0) ;; DIKO, esDIKO & MultiplierPoints

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

;; @desc needed in the governance contract
(define-read-only (diko-stdiko-ratio)
  (ok u1000000)
)

;; ---------------------------------------------------------
;; Stake & Unstake
;; ---------------------------------------------------------

;; @desc stake tokens in the pool
;; @param registry-trait; used to get reward per block
;; @param token; token to stake
;; @param amount; amount to stake
;; @post uint; returns amount of tokens staked
(define-public (stake (registry-trait <stake-registry-trait>) (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
  )
    (asserts! (or (is-eq (contract-of token) .arkadiko-token) (is-eq (contract-of token) .escrowed-diko-token)) ERR-WRONG-TOKEN)

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    ;; It also makes sure the multiplier points are credited to the staker
    (try! (claim-pending-rewards registry-trait))

    (let (
      (updated-stakes (get-stake-of staker))
    )
      ;; Update total stake and increase cummulative rewards
      (var-set total-staked (+ (var-get total-staked) amount))
      (unwrap-panic (increase-cumm-reward-per-stake registry-trait))

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
;; @param registry-trait; used to get reward per block
;; @param token; token to unstake
;; @param amount; amount to unstake
;; @post uint; returns amount of tokens unstaked
(define-public (unstake (registry-trait <stake-registry-trait>) (token <ft-trait>) (amount uint))
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
    (try! (claim-pending-rewards registry-trait))

    (let (
      ;; Calculate points to burn
      (updated-stakes (get-stake-of staker))
      (points-to-burn (/ (* (/ (* amount u1000000) (+ (get diko updated-stakes) (get esdiko updated-stakes))) (get points updated-stakes)) u1000000))
    )
      ;; Update total stake and increase cummulative rewards
      (var-set total-staked (- (var-get total-staked) amount points-to-burn))
      (unwrap-panic (increase-cumm-reward-per-stake registry-trait))

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
;; @param registry-trait; used to get reward per block
;; @param staker; staker to get pending rewards for
;; @post tuple; returns pending rewards
(define-public (get-pending-rewards (registry-trait <stake-registry-trait>) (staker principal))
  (let (
    (increase-result (try! (increase-cumm-reward-per-stake registry-trait)))
    (usda-rewards (unwrap-panic (get-pending-rewards-helper registry-trait staker .usda-token)))
    (esdiko-rewards (unwrap-panic (get-pending-rewards-helper registry-trait staker .escrowed-diko-token)))
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
;; @param registry-trait; used to get reward per block
;; @param staker; staker to get pending rewards for
;; @param token; reward token
;; @post uint; returns pending rewards
(define-public (get-pending-rewards-helper (registry-trait <stake-registry-trait>) (staker principal) (token principal))
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
;; @param registry-trait; used to get reward per block
;; @post uint; returns claimed rewards
(define-public (claim-pending-rewards (registry-trait <stake-registry-trait>))
  (let (
    (staker tx-sender)
    (current-stakes (get-stake-of staker))
    (added-points (calculate-multiplier-points staker))
    (new-points (+ added-points (get points current-stakes)))
  )
    (try! (claim-pending-rewards-helper registry-trait .escrowed-diko-token))
    (try! (claim-pending-rewards-helper registry-trait .usda-token))

    ;; Update last-block and points to reflect added points
    ;; Update total-staked with points added
    (map-set stakes { staker: staker } (merge current-stakes { last-update-block: block-height, amount: (+ (get amount current-stakes) added-points), points: new-points }))
    (var-set total-staked (+ (var-get total-staked) added-points))

    (ok true)
  )
)

;; Claim pending rewards for given token
(define-private (claim-pending-rewards-helper (registry-trait <stake-registry-trait>) (token <ft-trait>))
  (let (
    (staker tx-sender)
    (pending-rewards (unwrap! (get-pending-rewards-helper registry-trait staker (contract-of token)) ERR-REWARDS-CALC))
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
;; @param registry-trait; used to get reward per block
;; @post uint; new cummulative rewards per stake
(define-public (increase-cumm-reward-per-stake (registry-trait <stake-registry-trait>))
  (begin
    (try! (increase-cumm-esdiko-reward-per-stake registry-trait))
    (try! (increase-cumm-usda-reward-per-stake))
    (ok true)
  )
)

;; @desc increase cummulative rewards per stake for esDIKO
;; @param registry-trait; used to get reward per block
;; @post uint; the cummulative rewards per stake
(define-public (increase-cumm-esdiko-reward-per-stake (registry-trait <stake-registry-trait>))
  (let (
    (current-total-staked (var-get total-staked))
    (current-cumm-reward-per-stake (get cumm-reward-per-stake (get-reward-of .escrowed-diko-token))) 
    (rewards-per-block (unwrap-panic (contract-call? registry-trait get-rewards-per-block-for-pool (as-contract tx-sender))))
  )
    (asserts! (is-eq (contract-of registry-trait) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-registry"))) ERR-WRONG-REGISTRY)
    (asserts! (> block-height (get last-reward-increase-block (get-reward-of .escrowed-diko-token))) (ok current-cumm-reward-per-stake))

    (if (is-eq current-total-staked u0)
      (begin
        (map-set rewards { token: .escrowed-diko-token } { cumm-reward-per-stake: u0, last-reward-increase-block: block-height})
        (ok u0)
      )
      (let (
        (block-diff (- block-height (get last-reward-increase-block (get-reward-of .escrowed-diko-token))))
        (total-rewards-to-distribute (* rewards-per-block block-diff))
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
    (usda-balance (unwrap-panic (contract-call? .usda-token get-balance .arkadiko-freddie-v1-1)))
  )
    (asserts! (> usda-balance u0) (ok current-cumm-reward-per-stake))
    (asserts! (> block-height (get last-reward-increase-block (get-reward-of .usda-token))) (ok current-cumm-reward-per-stake))
    (asserts! (> current-total-staked u0) (ok current-cumm-reward-per-stake))

    ;; Transfer from Freddie to this contract
    (try! (contract-call? .arkadiko-dao burn-token .usda-token usda-balance .arkadiko-freddie-v1-1))
    (try! (contract-call? .arkadiko-dao mint-token .usda-token usda-balance .arkadiko-stake-pool-diko-v2-1))

    (let (
      ;; TODO: should be based on gathered USDA from last week
      (total-rewards-to-distribute usda-balance)
      (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) current-total-staked))
      (new-cumm-reward-per-stake (+ current-cumm-reward-per-stake reward-added-per-token))
    )
      (map-set rewards { token: .usda-token } { cumm-reward-per-stake: new-cumm-reward-per-stake, last-reward-increase-block: block-height})
      (ok new-cumm-reward-per-stake)
    )
  )
)
