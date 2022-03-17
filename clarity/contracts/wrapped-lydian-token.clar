;; @contract Wrapped Lydian SIP-010
;; @version 1

(impl-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token wrapped-lydian)

;; ------------------------------------------
;; Constants
;; ------------------------------------------

(define-constant  ERR-NOT-AUTHORIZED u1303001)

;; ------------------------------------------
;; Variables
;; ------------------------------------------

(define-data-var active-minter principal .treasury-v1-1)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var contract-owner principal tx-sender)

;; ------------------------------------------
;; Var & Map Helpers
;; ------------------------------------------

(define-read-only (get-active-minter)
  (var-get active-minter)
)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply wrapped-lydian))
)

(define-read-only (get-name)
  (ok "Wrapped Lydian Token")
)

(define-read-only (get-symbol)
  (ok "wLDN")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance wrapped-lydian account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender .lydian-dao)
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

    (match (ft-transfer? wrapped-lydian amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; ---------------------------------------------------------
;; Mint / Burn
;; ---------------------------------------------------------

(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq contract-caller (var-get active-minter)) (err  ERR-NOT-AUTHORIZED))
    (ft-mint? wrapped-lydian amount recipient)
  )
)

(define-public (burn (recipient principal) (amount uint))
  (begin
    (asserts!
      (or
        (is-eq contract-caller (var-get active-minter))
        (is-eq contract-caller recipient)
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (ft-burn? wrapped-lydian amount recipient)
  )
)

;; Initialize the contract
(begin
  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? wrapped-lydian u1923000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
)

