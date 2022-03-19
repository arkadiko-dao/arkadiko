
(define-read-only (get-snapshot-totals (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    ;; Total DIKO supply
    (diko-supply (unwrap-panic (at-block block-hash (contract-call? .arkadiko-token get-total-supply))))

    ;; stDIKO pool
    (stdiko-balance (unwrap-panic (at-block block-hash (contract-call? .arkadiko-token get-balance .arkadiko-stake-pool-diko-v1-2))))

    ;; STX/DIKO
    (stx-diko-data (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-v2-1 get-pair-details .wrapped-stx-token .arkadiko-token))))
    (stx-diko-balance (unwrap-panic (get balance-y stx-diko-data)))

    ;; DIKO/USDA
    (diko-usda-data (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-v2-1 get-pair-details .arkadiko-token .usda-token))))
    (diko-usda-balance (unwrap-panic (get balance-x diko-usda-data)))
  )
    (ok {
      diko-supply: diko-supply,
      stdiko-balance: stdiko-balance,
      stx-diko-balance: stx-diko-balance,
      diko-usda-balance: diko-usda-balance
    })
  )
)

