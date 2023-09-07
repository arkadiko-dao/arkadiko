;; Vaults Pool Liquidation 
;; USDA to use in liquidations, receive collateral rewards
;;

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u950401)
(define-constant ERR_SHUTDOWN u950501)
(define-constant ERR_WRONG_TOKENS u950001)
(define-constant ERR_CLAIM_FAILED u950002)
(define-constant ERR_INVALID_REWARD_TOKEN u950003)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var shutdown-activated bool false)

(define-data-var fragments-per-token uint u1000000000000)
(define-data-var fragments-total uint u0)

;; TODO: is it 10% for this pool?
(define-data-var diko-rewards-percentage uint u1000) ;; 10% in bps
(define-data-var diko-rewards-last-block uint block-height)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map tokens 
  { 
    token: principal 
  } 
  {
    cumm-reward-per-fragment: uint,
  }
)

(define-map stakers 
  { 
    staker: principal
  } 
  {
    fragments: uint,
  }
)

(define-map stakers-rewards 
  { 
    staker: principal,
    token: principal
  } 
  {
    cumm-reward-per-fragment: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-fragments-info)
  { per-token: (var-get fragments-per-token), total: (var-get fragments-total)}
)

(define-read-only (get-diko-rewards-info)
  { percentage: (var-get diko-rewards-percentage), last-block: (var-get diko-rewards-last-block) }
)

(define-read-only (get-token (token principal))
  (default-to
    {
      cumm-reward-per-fragment: u0
    }
    (map-get? tokens { token: token })
  )
)

(define-read-only (get-staker (staker principal))
  (default-to
    {
      fragments: u0
    }
    (map-get? stakers { staker: staker })
  )
)

(define-read-only (get-staker-rewards (staker principal) (token principal))
  (default-to
    {
      cumm-reward-per-fragment: u0
    }
    (map-get? stakers-rewards { staker: staker, token: token })
  )
)

;; ---------------------------------------------------------
;; Helpers - Reward Tokens
;; ---------------------------------------------------------

;; Returns true if reward-tokens list is equal to collateral token list
(define-public (check-reward-tokens (reward-tokens (list 25 <ft-trait>)))
  (let (
    (token-list (contract-call? .arkadiko-vaults-tokens-v1-1 get-token-list))
    (check-result (map is-same-token token-list reward-tokens))
  )
    (ok (is-none (index-of? check-result false)))
  )
)

(define-read-only (is-same-token (token-collateral principal) (token-reward <ft-trait>))
  (is-eq token-collateral (contract-of token-reward))
)

;; ---------------------------------------------------------
;; Stake / Unstake
;; ---------------------------------------------------------

;; Stake given USDA amount
;; Need reward-tokens list to claim all rewards first
(define-public (stake (amount uint) (reward-tokens (list 25 <ft-trait>)))
  (let (
    (staker tx-sender)
    (staker-info (get-staker staker))
    (fragments-added (* amount (var-get fragments-per-token)))

    ;; First, add DIKO rewards to pool and claim for user
    (result-diko-add (try! (add-diko-rewards)))
    (result-diko-claim (claim-pending-rewards .arkadiko-token))
    ;; Second, claim collateral rewards for use
    (claim-result (map claim-pending-rewards reward-tokens))
  )
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (unwrap-panic (check-reward-tokens reward-tokens)) (err ERR_WRONG_TOKENS))
    (asserts! (is-none (index-of? claim-result (ok false))) (err ERR_CLAIM_FAILED))
    (asserts! (unwrap-panic result-diko-claim) (err ERR_CLAIM_FAILED))

    ;; Transfer tokens
    (try! (contract-call? .usda-token transfer amount staker (as-contract tx-sender) none))

    (map-set stakers { staker: staker }
      { fragments: (+ (get fragments staker-info) fragments-added) }
    )

    (var-set fragments-total (+ (var-get fragments-total) fragments-added))

    (ok fragments-added)
  )
)

;; Unstake given USDA amount
;; Need reward-tokens list to claim all rewards first
(define-public (unstake (amount uint) (reward-tokens (list 25 <ft-trait>)))
  (let (
    (staker tx-sender)
    (staker-info (get-staker staker))
    (fragments-removed (* amount (var-get fragments-per-token)))

    ;; First, add DIKO rewards to pool and claim for user
    (result-diko-add (try! (add-diko-rewards)))
    (result-diko-claim (claim-pending-rewards .arkadiko-token))
    ;; Second, claim collateral rewards for use
    (claim-result (map claim-pending-rewards reward-tokens))
  )
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (unwrap-panic (check-reward-tokens reward-tokens)) (err ERR_WRONG_TOKENS))
    (asserts! (is-none (index-of? claim-result (ok false))) (err ERR_CLAIM_FAILED))
    (asserts! (unwrap-panic result-diko-claim) (err ERR_CLAIM_FAILED))

    ;; Transfer tokens
    (try! (as-contract (contract-call? .usda-token transfer amount tx-sender staker none)))

    (map-set stakers { staker: staker }
      { fragments: (- (get fragments staker-info) fragments-removed) }
    )

    (var-set fragments-total (- (var-get fragments-total) fragments-removed))

    (ok fragments-removed)
  )
)

;; ---------------------------------------------------------
;; User Rewards
;; ---------------------------------------------------------

;; Get pending rewards for staker, for given token
(define-public (get-pending-rewards (staker principal) (token principal))
  (let (
    (staker-info (get-staker staker))
    (rewards-info (get-staker-rewards staker token))
    (token-info (get-token token))

    (amount-owed-per-fragment (- (get cumm-reward-per-fragment token-info) (get cumm-reward-per-fragment rewards-info)))
    (rewards (/ (* (get fragments staker-info) amount-owed-per-fragment) u1000000))
  )
    (ok rewards)
  )
)

;; Claim pending rewards for staker, for given token
(define-public (claim-pending-rewards (token <ft-trait>))
  (let (
    (staker tx-sender)
    (staker-info (get-staker staker))
    (token-info (get-token (contract-of token)))

    ;; Add DIKO rewards
    (result-diko-add (try! (add-diko-rewards)))

    (pending-rewards (unwrap-panic (get-pending-rewards staker (contract-of token))))
  )
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))

    (if (>= pending-rewards u1)
      (begin
        (unwrap! (as-contract (contract-call? token transfer pending-rewards tx-sender staker none)) (ok false))

        (map-set stakers-rewards { staker: staker, token: (contract-of token) }
          { cumm-reward-per-fragment: (get cumm-reward-per-fragment token-info) }
        )

        (ok true)
      )
      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; Add Rewards
;; ---------------------------------------------------------

;; Add rewards to the pool
(define-public (add-rewards (token <ft-trait>) (amount uint))
  (let (
    (token-list (contract-call? .arkadiko-vaults-tokens-v1-1 get-token-list))
    (new-cumm-rewards (calculate-cumm-reward-per-fragment (contract-of token) amount))
  )
    (asserts! (is-some (index-of? token-list (contract-of token))) (err ERR_INVALID_REWARD_TOKEN))

    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))

    (map-set tokens { token: (contract-of token) }
      { cumm-reward-per-fragment: new-cumm-rewards }
    )

    (ok amount)
  )
)

;; Calculate cummulative rewards per fragments, after amount-added is added
(define-read-only (calculate-cumm-reward-per-fragment (token principal) (amount-added uint))
  (let (
    (current-total-fragments (var-get fragments-total))
    (current-cumm-reward-per-fragment (get cumm-reward-per-fragment (get-token token))) 
  )
    (if (> current-total-fragments u0)
      (let (
        (reward-added-per-fragment (/ (* amount-added u1000000) current-total-fragments))
        (new-cumm-reward-per-fragment (+ current-cumm-reward-per-fragment reward-added-per-fragment))
      )
        new-cumm-reward-per-fragment
      )
      current-cumm-reward-per-fragment
    )
  )
)

;; DIKO rewards that should be added
(define-read-only (get-diko-rewards-to-add)
  (let (
    (total-staking-rewards (contract-call? .arkadiko-diko-guardian-v1-1 get-staking-rewards-per-block))
    (total-pool-rewards (/ (* total-staking-rewards (var-get diko-rewards-percentage)) u10000))
    (block-diff (- block-height (var-get diko-rewards-last-block)))
  )
    (* total-pool-rewards block-diff)
  )
)

;; Add DIKO rewards
(define-private (add-diko-rewards)
  (let (
    (rewards-to-add (get-diko-rewards-to-add))
  )
    (add-rewards .arkadiko-token rewards-to-add)
  )
)

;; ---------------------------------------------------------
;; Burn
;; ---------------------------------------------------------

;; Burn USDA from pool, for liquidations
(define-public (burn-usda (amount uint))
  (let (
    (receiver tx-sender)
    (fragments-removed (* amount (var-get fragments-per-token)))
  )
    (asserts! (or
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
      (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner))
    ) (err ERR_NOT_AUTHORIZED))

    (var-set fragments-total (- (var-get fragments-total) fragments-removed))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token amount tx-sender)))

    (ok amount)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-diko-rewards-percentage (percentage uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (var-set diko-rewards-percentage percentage)

    (ok true)
  )
)

(define-public (set-shutdown-activated (activated bool))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (var-set shutdown-activated activated)

    (ok true)
  )
)
