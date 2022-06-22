;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map user-tracking
  { 
    user: principal
  } 
  {
    last-reward-id: uint
  }
)

(define-read-only (get-user-tracking (user principal))
  (default-to
    { last-reward-id: u0 }
    (map-get? user-tracking { user: user })
  )
)

;; ---------------------------------------------------------
;; Claim tracking
;; ---------------------------------------------------------

(define-public (increase-last-reward-id)
  (let (
    (last-id (get last-reward-id (get-user-tracking tx-sender)))
    (reward-list (map + 
      (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24) 
      (list last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id)
    ))
    (claimed-all (fold and (map has-claimed-reward reward-list) true))
  )
    (if claimed-all
      (map-set user-tracking  { user: tx-sender } { last-reward-id: (+ last-id u25) })
      true
    )
    (ok claimed-all)
  )
)

(define-private (has-claimed-reward (reward-id uint))
  (> (get claimed-amount (contract-call? .arkadiko-liquidation-rewards-v1-1 get-reward-claimed reward-id tx-sender)) u0)
)

;; ---------------------------------------------------------
;; Claim helpers
;; ---------------------------------------------------------

(define-public (claim-50-stx-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-50-diko-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-diko-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-50-xbtc-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-stx-rewards-of (reward-id uint))
  (contract-call? .arkadiko-liquidation-rewards-v1-1 claim-rewards-of reward-id .xstx-token .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-diko-rewards-of (reward-id uint))
  (contract-call? .arkadiko-liquidation-rewards-v1-1 claim-rewards-of reward-id .arkadiko-token .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-xbtc-rewards-of (reward-id uint))
  ;; TODO - UPDATE ADDRESS FOR MAINNET
  (contract-call? .arkadiko-liquidation-rewards-v1-1 claim-rewards-of reward-id .Wrapped-Bitcoin .arkadiko-liquidation-pool-v1-1)
)
