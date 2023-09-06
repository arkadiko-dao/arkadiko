;; Vaults Pool Active 
;; Stores collateral tokens
;;

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u940401)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (has-access (caller principal))
  (or
    (is-eq caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
    (is-eq caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
    (is-eq caller (contract-call? .arkadiko-dao get-dao-owner))
  )
)

;; ---------------------------------------------------------
;; Methods
;; ---------------------------------------------------------

;; Deposit tokens to pool
(define-public (deposit (token <ft-trait>) (sender principal) (amount uint))
  (begin
    (asserts! (has-access contract-caller) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? token transfer amount sender tx-sender none)))
    (ok true)
  )
)

;; Withdraw tokens from pool
(define-public (withdraw (token <ft-trait>) (receiver principal) (amount uint))
  (begin
    (asserts! (has-access contract-caller) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? token transfer amount tx-sender receiver none)))
    (ok true)
  )
)
