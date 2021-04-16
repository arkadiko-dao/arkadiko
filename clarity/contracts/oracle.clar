;; for now this is a fairly centralised Oracle, which is subject to failure.
;; Ideally, we implement a Chainlink Price Feed Oracle ASAP
(define-constant ERR-NOT-WHITELISTED u851)
(define-constant ORACLE-OWNER 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7)

(define-data-var last-price-in-cents uint u0)
(define-data-var last-block uint u0)

;; (define-private (get-oracle-owner)
  ;; (if is-in-regtest
  ;;   (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0xd2454d24b49126f7f47c986b06960d7f5b70812359084197a200d691e67a002e)
  ;;     'ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK ;; Testnet only
  ;;     'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7 ;; Other test environments
  ;;   )
  ;;   'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 ;; Mainnet (TODO)
  ;; )
;; )

(define-map prices
  { token: (string-ascii 12) }
  {
    last-price-in-cents: uint,
    last-block: uint
  }
)

(define-public (update-price (token (string-ascii 12)) (price uint))
  (if (is-eq tx-sender ORACLE-OWNER) ;;(get-oracle-owner))
    (begin
      (map-set prices { token: token } { last-price-in-cents: price, last-block: u0 })
      (ok price)
    )
    (err ERR-NOT-WHITELISTED)
  )
)

(define-read-only (get-price (token (string-ascii 12)))
  (unwrap! (map-get? prices {token: token }) { last-price-in-cents: u0, last-block: u0 })
)
