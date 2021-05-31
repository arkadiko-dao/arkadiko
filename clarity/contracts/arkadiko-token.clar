(impl-trait .sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

;; Defines the Arkadiko Governance Token according to the SRC20 Standard
(define-fungible-token diko)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var contract-owner principal tx-sender)

;; errors
(define-constant ERR-NOT-AUTHORIZED u1401)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set contract-owner owner))
  )
)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply diko))
)

(define-read-only (get-name)
  (ok "Arkadiko")
)

(define-read-only (get-symbol)
  (ok "DIKO")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance diko account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender (var-get contract-owner))
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (match (ft-transfer? diko amount sender recipient)
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
    (ft-mint? diko amount recipient)
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-burn? diko amount sender)
  )
)


;; Test environments
(begin
  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? diko u890000000000 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7))
  (try! (ft-mint? diko u150000000000 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  (try! (ft-mint? diko u150000000000 'ST3EQ88S02BXXD0T5ZVT3KW947CRMQ1C6DMQY8H19))
  (try! (ft-mint? diko u1000000000 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
  (try! (ft-mint? diko u1000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF))
)
