(define-trait oracle-trait
  (
    (fetch-price ((string-ascii 12)) (response (tuple (last-price uint) (last-block uint) (decimals uint)) uint))
  )
)
