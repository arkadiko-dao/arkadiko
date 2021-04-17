(impl-trait .mock-ft-trait.mock-ft-trait)

;; Defines an STX derivative according to the SRC20 Standard
(define-fungible-token xstx)

(define-data-var token-uri (string-utf8 256) u"")

;; errors

(define-constant ERR-BURN-FAILED u131)
(define-constant ERR-NOT-AUTHORIZED u13401)

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
  (if (is-eq tx-sender (get-contract-owner))
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
    (err ERR-NOT-AUTHORIZED)
  )
)
