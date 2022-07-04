;; Liquidation pool helpers for UI

(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait liquidation-pool-trait .arkadiko-liquidation-pool-trait-v1.liquidation-pool-trait)

;; ---------------------------------------------------------
;; Fetch
;; ---------------------------------------------------------

;; Combine pending user rewards + reward data
(define-public (get-user-reward-info (reward-id uint))
  (let (
    (sender-rewards (unwrap-panic (contract-call? .arkadiko-liquidation-rewards-v1-1 get-rewards-of tx-sender reward-id .arkadiko-liquidation-pool-v1-1)))
    (rewards-data (contract-call? .arkadiko-liquidation-rewards-v1-1 get-reward-data reward-id))
  )
    (ok {
      reward-id: reward-id,
      pending-rewards: sender-rewards,
      token: (get token rewards-data),
      token-is-stx: (get token-is-stx rewards-data)
    })
  )
)

;; ---------------------------------------------------------
;; Claim
;; ---------------------------------------------------------

(define-public (claim-10-stx-rewards-of (reward-ids (list 10 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-25-stx-rewards-of (reward-ids (list 25 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-50-stx-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-10-diko-rewards-of (reward-ids (list 10 uint)))
  (begin
    (map claim-diko-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-25-diko-rewards-of (reward-ids (list 25 uint)))
  (begin
    (map claim-diko-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-50-diko-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-diko-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-10-xbtc-rewards-of (reward-ids (list 10 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-25-xbtc-rewards-of (reward-ids (list 25 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-50-xbtc-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Claim helpers
;; ---------------------------------------------------------

(define-public (claim-stx-rewards-of (reward-id uint))
  (contract-call? .arkadiko-liquidation-rewards-v1-1 claim-rewards-of reward-id .xstx-token .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-diko-rewards-of (reward-id uint))
  (contract-call? .arkadiko-liquidation-rewards-v1-1 claim-rewards-of reward-id .arkadiko-token .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-xbtc-rewards-of (reward-id uint))
  ;; TODO - UPDATE ADDRESS FOR MAINNET
  (contract-call? .arkadiko-liquidation-rewards-v1-1 claim-rewards-of reward-id 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.Wrapped-Bitcoin .arkadiko-liquidation-pool-v1-1)
)
