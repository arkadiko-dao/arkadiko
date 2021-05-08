(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; for now this is a fairly centralised Oracle, which is subject to failure.
;; Ideally, we implement a Chainlink Price Feed Oracle ASAP
(define-constant ERR-NOT-WHITELISTED u851)
(define-constant ORACLE-OWNER tx-sender)

(define-data-var last-price-in-cents uint u0)
(define-data-var last-block uint u0)

(define-map prices
  { token: (string-ascii 12) }
  {
    last-price-in-cents: uint,
    last-block: uint
  }
)

(define-public (update-price (token (string-ascii 12)) (price uint))
  (if (is-eq tx-sender ORACLE-OWNER)
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

(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)
