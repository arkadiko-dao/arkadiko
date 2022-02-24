(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED u30401)
(define-constant ERR-WRONG-TOKEN u30402)

;; Constants

;; Variables
(define-data-var total-reward-ids uint u0)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map reward-data
  { 
    reward-id: uint,
  } 
  {
    share-block: uint, ;; block on which USDA shares are calculated
    token: principal,
    total-amount: uint
  }
)

(define-map reward-claimed
  { 
    reward-id: uint,
    user: principal
  } 
  {
    claimed-amount: uint
  }
)

(define-read-only (get-reward-data (reward-id uint))
  (default-to
    { share-block: u0, token: .usda-token, total-amount: u0 }
    (map-get? reward-data { reward-id : reward-id  })
  )
)

(define-read-only (get-reward-claimed (reward-id uint) (user principal))
  (default-to
    { claimed-amount: u0 }
    (map-get? reward-claimed { reward-id : reward-id, user: user })
  )
)

;; ---------------------------------------------------------
;; Add rewards
;; ---------------------------------------------------------

(define-public (add-reward (share-block uint) (token <ft-trait>) (total-amount uint))
  (let (
    (reward-id (var-get total-reward-ids))
  )
    ;; TODO
    ;; (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "auction-engine"))) (err ERR-NOT-AUTHORIZED))

    ;; Transfer rewards to contract
    (try! (contract-call? token transfer total-amount tx-sender (as-contract tx-sender) none))

    ;; Add reward to map
    (map-set reward-data  { reward-id: reward-id } { 
      share-block: share-block,
      token: (contract-of token),
      total-amount: total-amount
    })

    ;; Update total-reward-ids
    (var-set total-reward-ids (+ reward-id u1))

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Get rewards
;; ---------------------------------------------------------

(define-public (get-rewards-of (user principal) (reward-id uint))
  (let (
    (reward-info (get-reward-data reward-id))
    (share-block (get share-block reward-info))
    (total-amount (get total-amount reward-info))

    (user-shares (unwrap-panic (contract-call? .arkadiko-liquidation-pool-v1-1 get-shares-at user share-block)))
    (total-rewards (/ (* user-shares total-amount) u10000000))

    (claimed (get claimed-amount (get-reward-claimed reward-id user)))
  )
    (ok (- total-rewards claimed))
  )
)

(define-public (claim-rewards-of (reward-id uint) (token <ft-trait>))
  (let (
    (user tx-sender)
    (reward-amount (unwrap-panic (get-rewards-of user reward-id)))
    (reward-info (get-reward-data reward-id))
  )
    (asserts! (is-eq (contract-of token) (get token reward-info)) (err ERR-WRONG-TOKEN))

    (if (is-eq reward-amount u0)
      (ok u0)
      (begin 
        (try! (as-contract (contract-call? token transfer reward-amount (as-contract tx-sender) user none)))

        (map-set reward-claimed  { reward-id: reward-id, user: user } { claimed-amount: reward-amount })

        (ok reward-amount)
      )
    )
  )
)


