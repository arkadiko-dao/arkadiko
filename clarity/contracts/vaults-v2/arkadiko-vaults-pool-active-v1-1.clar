;; Vaults Pool Active 
;; Stores collateral tokens
;;

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u960401)

;; ---------------------------------------------------------
;; Methods
;; ---------------------------------------------------------

(define-public (deposit (token <ft-trait>) (sender principal) (amount uint))
  (begin
    ;; TODO: update this access control
    (asserts! (is-eq contract-caller contract-caller) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? token transfer amount sender tx-sender none)))

    (ok true)
  )
)

(define-public (withdraw (token <ft-trait>) (receiver principal) (amount uint))
  (begin
    ;; TODO: update this access control
    (asserts! (is-eq contract-caller contract-caller) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? token transfer amount tx-sender receiver none)))

    (ok true)
  )
)
