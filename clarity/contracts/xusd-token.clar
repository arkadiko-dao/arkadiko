(impl-trait .mock-ft-trait.mock-ft-trait)

;; Defines the xUSD Stablecoin according to the SIP-010 Standard
(define-fungible-token xusd)

(define-data-var token-uri (string-utf8 256) u"")

;; errors
(define-constant ERR-BURN-FAILED u141)
(define-constant ERR-NOT-AUTHORIZED u14401)

(define-constant CONTRACT-OWNER tx-sender)

(define-read-only (get-total-supply)
  (ok (ft-get-supply xusd))
)

(define-read-only (get-name)
  (ok "xUSD")
)

(define-read-only (get-symbol)
  (ok "xUSD")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance-of (account principal))
  (ok (ft-get-balance xusd account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender CONTRACT-OWNER)
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (ft-transfer? xusd amount sender recipient)
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (if
      (and
        (or
          (is-eq contract-caller .freddie)
          (is-eq contract-caller .stx-reserve)
          (is-eq contract-caller .sip10-reserve)
        )
        (is-ok (ft-mint? xusd amount recipient))
      )
      (ok amount)
      (err false)
    )
  )
)

(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! 
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .dao get-qualified-name-by-name "auction-engine")))
      )
      (err ERR-BURN-FAILED)
    )
    (ft-burn? xusd amount sender)
  )
)

;; Initialize the contract
(begin
  (try! (ft-mint? xusd u20 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  (try! (ft-mint? xusd u10 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
  (try! (ft-mint? xusd u1000000000 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7))
)
