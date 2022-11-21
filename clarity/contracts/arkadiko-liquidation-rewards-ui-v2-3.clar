;; TODO: update with mainnet address
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait liquidation-pool-trait .arkadiko-liquidation-pool-trait-v1.liquidation-pool-trait)

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
            (claimed-amount (get claimed-amount (contract-call? .arkadiko-liquidation-rewards-v1-1 get-reward-claimed reward-id tx-sender)))
          )
            (if (is-eq user-shares u0)
              true
              (> claimed-amount u0)
            )
          )
        )
      )
    )
  )
)

;; ---------------------------------------------------------
;; Claim helpers
;; ---------------------------------------------------------

(define-public (claim-50-rewards-of (reward-ids (list 50 uint)) (token <ft-trait>) (increase-reward-id bool))
  (let (
    (token-list (list token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token token))
  )
    (map claim-rewards-of reward-ids token-list)
    (if increase-reward-id
      (begin
        (unwrap-panic (increase-last-reward-id))
        (unwrap-panic (increase-last-reward-id))
      )
      false
    )
    (ok true)
  )
)

(define-public (claim-25-rewards-of (reward-ids (list 25 uint)) (token <ft-trait>) (increase-reward-id bool))
  (let (
    (token-list (list token token token token token token token token token token token token token token token token token token token token token token token token token))
  )
    (map claim-rewards-of reward-ids token-list)
    (if increase-reward-id
      (begin
        (unwrap-panic (increase-last-reward-id))
      )
      false
    )
    (ok true)
  )
)
 
(define-public (claim-rewards-of (reward-id uint) (token <ft-trait>))
  (contract-call? .arkadiko-liquidation-rewards-v1-2 claim-rewards-of reward-id token .arkadiko-liquidation-pool-v1-1)
)
