;; @contract LP Stake Pool
;; @version 2.0

;; Traits
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait stake-pool-diko-trait .arkadiko-stake-pool-diko-trait-v2.stake-pool-diko-trait)
(use-trait vest-esdiko-trait .arkadiko-vest-esdiko-trait-v1.vest-esdiko-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED (err u110001))
(define-constant ERR-WRONG-TOKEN (err u110002))
(define-constant ERR-INSUFFICIENT-STAKE (err u110003))
(define-constant ERR-INACTIVE (err u110004))

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var contract-active bool true)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

;; Tokens
(define-map tokens 
  { token: principal } 
  {
    enabled: bool,
    total-staked: uint,
    rewards-rate: uint,
    last-reward-increase-block: uint,
    cumm-reward-per-stake: uint
  }
)

;; Track cummulative rewards per staker and token
(define-map stakers 
  { 
    staker: principal,
    token: principal
  } 
  {
    total-staked: uint,
    cumm-reward-per-stake: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

;; @desc check if contract is activate
(define-read-only (get-contract-active)
  (var-get contract-active)
)

;; @desc get token info
(define-read-only (get-token-info-of (token principal))
  (default-to
    { enabled: false, total-staked: u0, rewards-rate: u0, last-reward-increase-block: u0, cumm-reward-per-stake: u0 }
    (map-get? tokens { token: token })
  )
)

;; @desc get info for multiple tokens
(define-read-only (get-token-info-many-of (token-list (list 10 principal)))
  (map get-token-info-of token-list)
)

;; @desc get staker info
(define-read-only (get-staker-info-of (staker principal) (token principal))
  (default-to
    { total-staked: u0, cumm-reward-per-stake: u0 }
    (map-get? stakers { staker: staker, token: token })
  )
)

;; @desc get staker info of multiple tokens
(define-read-only (get-staker-info-many-of (staker principal) (token-list (list 10 principal)))
  (let (
    (staker-list (list staker staker staker staker staker staker staker staker staker staker))
  )
    (map get-staker-info-of staker-list token-list)
  )
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
    (token-info (get-token-info-of (contract-of token)))
  )
    (asserts! (get enabled token-info) ERR-WRONG-TOKEN)
    (asserts! (get-contract-active) ERR-INACTIVE)

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    (try! (claim-pending-rewards (contract-of token)))

    ;; Update total stake, increase cummulative rewards
    (map-set tokens { token: (contract-of token) } (merge token-info { total-staked: (+ (get total-staked token-info) amount) }))
    (unwrap-panic (increase-cumm-reward-per-stake (contract-of token)))

    ;; Transfer tokens
    (try! (contract-call? token transfer amount staker (as-contract tx-sender) none))
    
    ;; Update staker info
    (let (
      (new-staker-info (get-staker-info-of staker (contract-of token)))
      (new-token-info (get-token-info-of (contract-of token)))
    )
      (map-set stakers { staker: staker, token: (contract-of token) } (merge new-staker-info { 
        total-staked: (+ (get total-staked new-staker-info) amount),
        cumm-reward-per-stake: (get cumm-reward-per-stake new-token-info)
      }))
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
    (token-info (get-token-info-of (contract-of token)))
  )
    (asserts! (get-contract-active) ERR-INACTIVE)
    (asserts! (get enabled (get-token-info-of (contract-of token))) ERR-WRONG-TOKEN)
    (asserts! (<= amount (get total-staked (get-staker-info-of staker (contract-of token)))) ERR-INSUFFICIENT-STAKE)

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    (try! (claim-pending-rewards (contract-of token)))

    ;; Update total stake, increase cummulative rewards
    (map-set tokens { token: (contract-of token) } (merge token-info { total-staked: (- (get total-staked token-info) amount) }))
    (unwrap-panic (increase-cumm-reward-per-stake (contract-of token)))

    ;; Transfer tokens and update map
    (try! (as-contract (contract-call? token transfer amount tx-sender staker none)))

    ;; Update staker info
    (let (
      (new-staker-info (get-staker-info-of staker (contract-of token)))
      (new-token-info (get-token-info-of (contract-of token)))
    )
      (map-set stakers { staker: staker, token: (contract-of token) } (merge new-staker-info { 
        total-staked: (- (get total-staked new-staker-info) amount),
        cumm-reward-per-stake: (get cumm-reward-per-stake new-token-info)
      }))
      (ok amount)
    )
  )
)

;; ---------------------------------------------------------
;; User rewards
;; ---------------------------------------------------------

;; @desc get amount of pending rewards for given staker and token
;; @param staker; staker to get pending rewards for
;; @param token; stake token
;; @post uint; returns pending rewards
(define-read-only (get-pending-rewards (staker principal) (token principal))
  (let (
    (token-info (get-token-info-of token))
    (staker-info (get-staker-info-of staker token))

    (amount-owed-per-token (- (calculate-cumm-reward-per-stake token) (get cumm-reward-per-stake staker-info)))
    (rewards-decimals (* (get total-staked staker-info) amount-owed-per-token))
    (rewards-result (/ rewards-decimals u1000000))
  )
    (ok rewards-result)
  )
)

;; @desc claim all pending rewards
;; @param token; stake token
;; @post uint; returns claimed rewards
(define-public (claim-pending-rewards (token principal))
  (let (
    ;; Increase first
    (increase-result (increase-cumm-reward-per-stake token))

    (staker tx-sender)
    (token-info (get-token-info-of token))
    (staker-info (get-staker-info-of staker token))
    (pending-rewards (unwrap-panic (get-pending-rewards staker token)))
  )
    (asserts! (> pending-rewards u0) (ok u0))
    (asserts! (get-contract-active) ERR-INACTIVE)

    ;; Mint esDIKO
    (try! (contract-call? .arkadiko-dao mint-token .escrowed-diko-token pending-rewards staker))

    ;; Update staker cumm reward per stake
    (map-set stakers { staker: staker, token: token } (merge staker-info { cumm-reward-per-stake: (get cumm-reward-per-stake token-info) }))

    (ok pending-rewards)
  )
)

;; @desc stake all pending rewards
;; @param diko-pool; pool to stake rewards in
;; @param vesting; vesting contract
;; @param token; stake token
;; @post uint; returns claimed rewards
(define-public (stake-pending-rewards (diko-pool <stake-pool-diko-trait>) (vesting <vest-esdiko-trait>) (token principal))
  (let (
    (claimed-amount (try! (claim-pending-rewards token)))
  )
    (asserts! (get-contract-active) ERR-INACTIVE)
    (contract-call? diko-pool stake .escrowed-diko-token claimed-amount vesting)
  )
)

;; ---------------------------------------------------------
;; Cummulative rewards
;; ---------------------------------------------------------

;; @desc increase cummulative rewards per stake for esDIKO
;; @param token; stake token
;; @post uint; the cummulative rewards per stake
(define-public (increase-cumm-reward-per-stake (token principal))
  (let (
    (new-cumm-reward-per-stake (calculate-cumm-reward-per-stake token))
    (token-info (get-token-info-of token))
  )
    (map-set tokens { token: token } (merge token-info { cumm-reward-per-stake: new-cumm-reward-per-stake, last-reward-increase-block: block-height }))
    (ok new-cumm-reward-per-stake)
  )
)

;; @desc calculate the new cummulative rewards per stake for given token
;; @param token; stake token
;; @post uint; the cummulative rewards per stake
(define-read-only (calculate-cumm-reward-per-stake (token principal))
  (let (
    (token-info (get-token-info-of token))
  )
    (asserts! (> block-height (get last-reward-increase-block token-info)) (get cumm-reward-per-stake token-info))

    (if (is-eq (get total-staked token-info) u0)
      u0
      (let (
        (total-block-rewards (contract-call? .arkadiko-diko-guardian-v1-1 get-staking-rewards-per-block))
        (block-diff (- block-height (get last-reward-increase-block token-info)))
        (total-rewards-to-distribute (/ (* (get rewards-rate token-info) block-diff total-block-rewards) u1000000))
        (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) (get total-staked token-info)))
        (new-cumm-reward-per-stake (+ (get cumm-reward-per-stake token-info) reward-added-per-token))
      )
        new-cumm-reward-per-stake
      )
    )
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; @desc add token info
;; @param token; token to update
;; @param enabled; if token is enabled
;; @param rewards-rate; rewards rate for staking token
;; @post bool; always true
(define-public (add-token-info (token principal) (enabled bool) (rewards-rate uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) ERR-NOT-AUTHORIZED)
    (map-set tokens { token: token } {
      enabled: true,
      total-staked: u0,
      rewards-rate: rewards-rate,
      last-reward-increase-block: block-height,
      cumm-reward-per-stake: u0 
    })
    (ok true)
  )
)

;; @desc set token info
;; @param token; token to update
;; @param enabled; if token is enabled
;; @param rewards-rate; rewards rate for staking token
;; @post bool; always true
(define-public (update-token-info (token principal) (enabled bool) (rewards-rate uint))
  (let (
    (token-info (get-token-info-of token))
  ) 
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) ERR-NOT-AUTHORIZED)
    (map-set tokens { token: token } (merge token-info { enabled: enabled, rewards-rate: rewards-rate }))
    (ok true)
  )
)

;; @desc activate or deactivate contract
;; @param active; activate or not
;; @post bool; always true
(define-public (set-contract-active (active bool))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) ERR-NOT-AUTHORIZED)
    (var-set contract-active active)
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  ;; TODO: update rewards-rate for mainnet
  (map-set tokens { token: .arkadiko-swap-token-diko-usda } {
    enabled: true,
    total-staked: u0,
    rewards-rate: u250000, ;; 25%
    last-reward-increase-block: u0,
    cumm-reward-per-stake: u0 
  })
  (map-set tokens { token: .arkadiko-swap-token-wstx-usda } {
    enabled: true,
    total-staked: u0,
    rewards-rate: u350000, ;; 35%
    last-reward-increase-block: u0,
    cumm-reward-per-stake: u0
  })
  (map-set tokens { token: .arkadiko-swap-token-xbtc-usda } {
    enabled: true,
    total-staked: u0,
    rewards-rate: u100000, ;; 10%
    last-reward-increase-block: u0,
    cumm-reward-per-stake: u0
  })
)
