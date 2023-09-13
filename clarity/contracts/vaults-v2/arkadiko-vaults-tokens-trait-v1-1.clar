(define-trait vaults-tokens-trait
  (
    (get-token-list () (response (list 25 principal) uint))
    (get-token (principal) (response (tuple 
      (token-name (string-ascii 12)) 
      (max-debt uint) 
      (vault-min-debt uint)
      (stability-fee uint)

      (liquidation-ratio uint)
      (liquidation-penalty uint)

      (redemption-fee-min uint)
      (redemption-fee-max uint)
      (redemption-fee-block-interval uint)
      (redemption-fee-block-rate uint)
    ) uint))
  )
)
