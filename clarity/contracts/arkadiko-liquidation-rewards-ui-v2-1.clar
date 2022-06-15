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
      (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31 u32 u33 u34 u35 u36 u37 u38 u39 u40 u41 u42 u43 u44 u45 u46 u47 u48 u49) 
      (list last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id last-id)
    ))
    (claimed-all (fold and (map has-claimed-reward reward-list) true))
  )
    (if (is-eq claimed-all true)
      (map-set user-tracking  { user: tx-sender } { last-reward-id: (+ last-id u50) })
      true
    )
    (ok claimed-all)
  )
)

(define-private (has-claimed-reward (reward-id uint))
 (let (
    (pending-rewards (unwrap-panic (contract-call? .arkadiko-liquidation-rewards-v1-1 get-rewards-of tx-sender reward-id .arkadiko-liquidation-pool-v1-1)))
    (total-reward-ids (contract-call? .arkadiko-liquidation-rewards-v1-1 get-total-reward-ids))
 )
  (if (and 
    (< reward-id total-reward-ids)
    (is-eq pending-rewards u0)
  )
    true
    false
  )
 )
)

;; ---------------------------------------------------------
;; Claim helpers
;; ---------------------------------------------------------

(define-public (claim-50-stx-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-50-diko-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-diko-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-50-xbtc-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
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
