;; Vaults Pool Active 
;; Stores collateral tokens
;;

(impl-trait .arkadiko-vaults-pool-active-trait-v1-1.vaults-pool-active-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u940401)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (has-access)
  (or
    (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
    (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
    (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner))
  )
)

;; ---------------------------------------------------------
;; Methods
;; ---------------------------------------------------------

;; Deposit tokens to pool
(define-public (deposit (token <ft-trait>) (sender principal) (amount uint))
  (begin
    (asserts! (has-access) (err ERR_NOT_AUTHORIZED))

    (try! (contract-call? token transfer amount sender (as-contract tx-sender) none))
    (ok true)
  )
)

;; Withdraw tokens from pool
(define-public (withdraw (token <ft-trait>) (receiver principal) (amount uint))
  (begin
    (asserts! (has-access) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? token transfer amount tx-sender receiver none)))
    (ok true)
  )
)
