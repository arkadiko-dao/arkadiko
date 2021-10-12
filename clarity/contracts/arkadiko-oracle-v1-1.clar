(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; for now this is a fairly centralised Oracle, which is subject to failure.
;; Ideally, we implement a Chainlink Price Feed Oracle ASAP
(define-constant ERR-NOT-WHITELISTED u851)
(define-constant ERR-NOT-AUTHORIZED u8401)

(define-data-var oracle-owner principal tx-sender)
(define-data-var last-price uint u0)
(define-data-var last-block uint u0)

(define-map prices
  { token: (string-ascii 12) }
  {
    last-price: uint,
    last-block: uint,
    decimals: uint
  }
)

(define-public (set-oracle-owner (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set oracle-owner address))
  )
)

(define-public (update-price (token (string-ascii 12)) (price uint) (decimals uint))
  (if (is-eq tx-sender (var-get oracle-owner))
    (begin
      (map-set prices { token: token } { last-price: price, last-block: block-height, decimals: decimals })
      (ok price)
    )
    (err ERR-NOT-WHITELISTED)
  )
)

(define-read-only (get-price (token (string-ascii 12)))
  (unwrap! (map-get? prices { token: token }) { last-price: u0, last-block: u0, decimals: u0 })
)

(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)
