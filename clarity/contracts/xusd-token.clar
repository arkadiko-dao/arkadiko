(impl-trait .arkadiko-mock-ft-trait-v1.mock-ft-trait)
(impl-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

;; Defines the xUSD Stablecoin according to the SIP-010 Standard
(define-fungible-token xusd)

(define-data-var token-uri (string-utf8 256) u"")

;; errors
(define-constant ERR-NOT-AUTHORIZED u14401)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

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
  (if (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (match (ft-transfer? xusd amount sender recipient)
    response (begin
      (print memo)
      (ok response)
    )
    error (err error)
  )
)

;; ---------------------------------------------------------
;; DAO token trait
;; ---------------------------------------------------------

;; Mint method for DAO
(define-public (mint-for-dao (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-mint? xusd amount recipient)
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-burn? xusd amount sender)
  )
)


;; Initialize the contract
(begin
  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? xusd u20 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  (try! (ft-mint? xusd u10 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
  (try! (ft-mint? xusd u1000000000 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7))
)
