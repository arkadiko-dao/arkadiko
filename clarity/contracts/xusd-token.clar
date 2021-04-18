(impl-trait .mock-ft-trait.mock-ft-trait)

;; Defines the xUSD Stablecoin according to the SIP-010 Standard
(define-fungible-token xusd)

(define-data-var token-uri (string-utf8 256) u"")

;; errors
(define-constant ERR-BURN-FAILED u141)
(define-constant ERR-NOT-AUTHORIZED u14401)

(define-private (get-contract-owner)
  (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0xd2454d24b49126f7f47c986b06960d7f5b70812359084197a200d691e67a002e)
    'ST2YP83431YWD9FNWTTDCQX8B3K0NDKPCV3B1R30H ;; Testnet only
    (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0x6b2c809627f2fd19991d8eb6ae034cb4cce1e1fc714aa77351506b5af1f8248e)
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 ;; Mainnet (TODO)
      'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7 ;; Other test environments
    )
  )
)

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
  (if (is-eq tx-sender (get-contract-owner))
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
      (or (is-eq contract-caller .freddie) (is-eq contract-caller .auction-engine))
      (err ERR-BURN-FAILED))
    (ft-burn? xusd amount sender)))

;; Initialize the contract
(begin
  ;; Testnet only: seed wallet_2 and wallet_3
  ;; (asserts! is-in-regtest (ok u0))
  (try! (ft-mint? xusd u20 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  (try! (ft-mint? xusd u10 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
  (try! (ft-mint? xusd u1000000000 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7))
)
