;; Return on-chain data of sBTC on Arkadiko

(define-read-only (get-total-sBTC-balance)
  (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token get-balance .arkadiko-vaults-pool-active-v1-1)
)

(define-read-only (get-user-sBTC-balance (owner principal))
  (let (
    (vault (unwrap-panic (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)))
  )
    (get collateral vault)
  )
)
