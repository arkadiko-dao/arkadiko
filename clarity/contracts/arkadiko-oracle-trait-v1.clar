(define-trait oracle-trait
  (
    (fetch-price ((string-ascii 12)) (response (tuple (last-price-in-cents uint) (last-block uint)) uint))
  )
)
