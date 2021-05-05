(impl-trait .mock-ft-trait.mock-ft-trait)
(impl-trait .dao-token-trait.dao-token-trait)

;; Defines an STX derivative according to the SRC20 Standard
(define-fungible-token xstx)

(define-data-var token-uri (string-utf8 256) u"")

;; errors

(define-constant ERR-BURN-FAILED u131)
(define-constant ERR-NOT-AUTHORIZED u13401)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

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

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender (contract-call? .dao get-dao-owner))
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (ft-transfer? xstx amount sender recipient)
)


;; ---------------------------------------------------------
;; DAO token trait
;; ---------------------------------------------------------

;; Mint method for DAO
(define-public (mint-for-dao (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller .dao) (err ERR-NOT-AUTHORIZED))
    (ft-mint? xstx amount recipient)
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .dao) (err ERR-NOT-AUTHORIZED))
    (ft-burn? xstx amount sender)
  )
)
