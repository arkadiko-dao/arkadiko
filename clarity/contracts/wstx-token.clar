;; Wrapped STX token 
;; To have a SIP-010 representation of STX
;;

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token wrapped-stx)

;; ------------------------------------------
;; Constants
;; ------------------------------------------

(define-constant  ERR-NOT-AUTHORIZED u1403001)

;; ------------------------------------------
;; Variables
;; ------------------------------------------

(define-data-var token-uri (string-utf8 256) u"")

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply wrapped-stx))
)

(define-read-only (get-name)
  (ok "Wrapped Stacks Token")
)

(define-read-only (get-symbol)
  (ok "wSTX")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance wrapped-stx account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
    (ok (var-set token-uri value))
    (err  ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err  ERR-NOT-AUTHORIZED))

    (match (ft-transfer? wrapped-stx amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; ---------------------------------------------------------
;; Wrap / Unwrap
;; ---------------------------------------------------------

(define-public (wrap (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ft-mint? wrapped-stx amount tx-sender)
  )
)

(define-public (unwrap (amount uint))
  (let (
    (recipient tx-sender)
  )
    (try! (as-contract (stx-transfer? amount (as-contract tx-sender) recipient)))
    (ft-burn? wrapped-stx amount recipient)
  )
)