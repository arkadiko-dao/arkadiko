(define-read-only (get-pair-details-at-block (block uint) (token-x principal) (token-y principal))
  (at-block
    (unwrap-panic (get-block-info? id-header-hash block))
    (contract-call? .arkadiko-swap-v1-1 get-pair-details token-x token-y)
  )
)
