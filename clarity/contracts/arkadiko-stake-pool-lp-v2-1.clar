;; @contract LP Stake Pool
;; @version 2.0

;; Traits
;; TODO: update address
(use-trait ft-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED (err u110001))
(define-constant ERR-WRONG-TOKEN (err u110002))
(define-constant ERR-INSUFFICIENT-STAKE (err u110003))

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

;; Tokens
(define-map tokens 
  { token: principal } 
  {
    enabled: bool,
    total-staked: uint,
    block-rewards: uint,
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

;; @desc get token info
(define-read-only (get-token-info-of (token principal))
  (default-to
    { enabled: false, total-staked: u0, block-rewards: u0, last-reward-increase-block: u0, cumm-reward-per-stake: u0 }
    (map-get? tokens { token: token })
  )
)

;; @desc get staker info
(define-read-only (get-staker-info-of (staker principal) (token principal))
  (default-to
    { total-staked: u0, cumm-reward-per-stake: u0 }
    (map-get? stakers { staker: staker, token: token })
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

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    (try! (claim-pending-rewards (contract-of token)))

    ;; Update total stake, increase cummulative rewards
    (map-set tokens { token: (contract-of token) } (merge token-info { total-staked: (+ (get total-staked token-info) amount) }))
    (unwrap-panic (increase-cumm-reward-per-stake (contract-of token)))

    ;; Transfer tokens
    (try! (contract-call? token transfer amount staker (as-contract tx-sender) none))
    
    ;; Update staker info
    (let (
      (staker-info (get-staker-info-of staker (contract-of token)))
      (new-token-info (get-token-info-of (contract-of token)))
    )
      (map-set stakers { staker: staker, token: (contract-of token) } (merge staker-info { 
        total-staked: (+ (get total-staked staker-info) amount),
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
      (staker-info (get-staker-info-of staker (contract-of token)))
      (new-token-info (get-token-info-of (contract-of token)))
    )
      (map-set stakers { staker: staker, token: (contract-of token) } (merge staker-info { 
        total-staked: (- (get total-staked staker-info) amount),
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

    ;; Mint esDIKO
    (try! (contract-call? .arkadiko-dao mint-token .escrowed-diko-token pending-rewards staker))

    ;; Update staker cumm reward per stake
    (map-set stakers { staker: staker, token: token } (merge staker-info { cumm-reward-per-stake: (get cumm-reward-per-stake token-info) }))

    (ok pending-rewards)
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
        (block-diff (- block-height (get last-reward-increase-block token-info)))
        (total-rewards-to-distribute (* (get block-rewards token-info) block-diff))
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

;; @desc set token info
;; @param token; token to update
;; @param enabled; if token is enabled
;; @param block-rewards; rewards per block for staking token
;; @post bool; always true
(define-public (set-token-info (token principal) (enabled bool) (block-rewards uint))
  (let (
    (token-info (get-token-info-of token))
  ) 
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) ERR-NOT-AUTHORIZED)
    (map-set tokens { token: token } (merge token-info { enabled: enabled, block-rewards: block-rewards }))
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  ;; TODO: update block-rewards for mainnet
  (map-set tokens { token: .arkadiko-swap-token-diko-usda } {
    enabled: true,
    total-staked: u0,
    block-rewards: u1000000,
    last-reward-increase-block: u0,
    cumm-reward-per-stake: u0 
  })
  (map-set tokens { token: .arkadiko-swap-token-wstx-usda } {
    enabled: true,
    total-staked: u0,
    block-rewards: u2000000,
    last-reward-increase-block: u0,
    cumm-reward-per-stake: u0
  })
  (map-set tokens { token: .arkadiko-swap-token-xbtc-usda } {
    enabled: true,
    total-staked: u0,
    block-rewards: u3000000,
    last-reward-increase-block: u0,
    cumm-reward-per-stake: u0
  })
)
