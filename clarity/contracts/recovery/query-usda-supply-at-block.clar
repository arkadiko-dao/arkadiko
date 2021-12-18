(define-read-only (get-usda-supply-at-block (block uint))
  (at-block
    (unwrap-panic (get-block-info? id-header-hash block))
    (contract-call? .usda-token get-total-supply)
  )
)
