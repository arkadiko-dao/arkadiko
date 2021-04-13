(impl-trait .mock-ft-trait.mock-ft-trait)

;; Defines an STX derivative according to the SRC20 Standard
(define-fungible-token xstx)

(define-constant err-burn-failed u1234)
(define-constant err-unauthorized u403)

(define-read-only (get-total-supply)
  (ok (ft-get-supply xstx))
)

(define-read-only (get-name)
  (ok "xSTX")
)

(define-read-only (get-symbol)
  (ok "xSTX")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance-of (account principal))
  (ok (ft-get-balance xstx account))
)

;; TODO - finalize before mainnet deployment
(define-read-only (get-token-uri)
  (ok none)
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (ft-transfer? xstx amount sender recipient)
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (if
      (and
        (is-eq contract-caller .sip10-reserve)
        (is-ok (ft-mint? xstx amount recipient))
      )
      (ok amount)
      (err u0)
    )
  )
)

(define-public (burn (amount uint) (sender principal))
  (if (is-eq contract-caller .sip10-reserve)
    (ft-burn? xstx amount sender)
    (err err-unauthorized)
  )
)
