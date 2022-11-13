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
  (let (
    (claimed (get claimed (contract-call? .arkadiko-liquidation-rewards-v1-2 get-reward-claimed reward-id tx-sender)))
  )
    (if claimed
      true
      (let (
        (share-block (get share-block (contract-call? .arkadiko-liquidation-rewards-v1-2 get-reward-data reward-id)))
      )
        (if (is-eq share-block u0)
          false
          (let (
            (user-shares (unwrap-panic (contract-call? .arkadiko-liquidation-pool-v1-1 get-shares-at tx-sender share-block)))
          )
            (is-eq user-shares u0)
          )
        )
      )
    )
  )
)

;; ---------------------------------------------------------
;; Claim helpers
;; ---------------------------------------------------------

(define-public (claim-simple-50-stx-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-simple-50-diko-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-diko-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-simple-50-xbtc-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
    (ok true)
  )
)

(define-public (claim-50-stx-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-stx-rewards-of reward-ids)
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
    (ok true)
  )
)

(define-public (claim-50-xbtc-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-xbtc-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-50-atalex-rewards-of (reward-ids (list 50 uint)))
  (begin
    (map claim-atalex-rewards-of reward-ids)
    (unwrap-panic (increase-last-reward-id))
    (unwrap-panic (increase-last-reward-id))
    (ok true)
  )
)

(define-public (claim-stx-rewards-of (reward-id uint))
  (contract-call? .arkadiko-liquidation-rewards-v1-2 claim-rewards-of reward-id .xstx-token .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-diko-rewards-of (reward-id uint))
  (contract-call? .arkadiko-liquidation-rewards-v1-2 claim-rewards-of reward-id .arkadiko-token .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-xbtc-rewards-of (reward-id uint))
  ;; TODO - UPDATE ADDRESS FOR MAINNET
  (contract-call? .arkadiko-liquidation-rewards-v1-2 claim-rewards-of reward-id .Wrapped-Bitcoin .arkadiko-liquidation-pool-v1-1)
)

(define-public (claim-atalex-rewards-of (reward-id uint))
  ;; TODO - UPDATE ADDRESS FOR MAINNET
  (contract-call? .arkadiko-liquidation-rewards-v1-2 claim-rewards-of reward-id .auto-alex .arkadiko-liquidation-pool-v1-1)
)
