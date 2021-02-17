;; for now this is a fairly centralised Oracle, which is subject to failure.
;; Ideally, we implement a Chainlink Price Feed Oracle ASAP
(define-constant err-not-white-listed u51)

(define-data-var last-price uint u0)
(define-data-var last-block uint u0)

(define-constant oracle-owner 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH)

(define-public (update-price (price uint))
  (if (is-eq tx-sender oracle-owner)
    (begin
      (var-set last-price price)
      (var-set last-block u0)
      (ok price)
    )
    (err err-not-white-listed)
  )
)

(define-read-only (get-price)
  { price: (var-get last-price), height: (var-get last-block) }
)
