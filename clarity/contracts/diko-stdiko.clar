(define-read-only (get-ratio-at-block (block uint))
  (at-block
    (unwrap-panic (get-block-info? id-header-hash block))
    (contract-call? .arkadiko-stake-pool-diko-v1-2 diko-stdiko-ratio)
  )
)
