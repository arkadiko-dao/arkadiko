(define-trait collateral-types-trait
  (
    (get-collateral-type-by-name ((string-ascii 12)) (response (tuple (name (string-ascii 256)) (token (string-ascii 12)) (token-type (string-ascii 12)) (url (string-ascii 256)) (total-debt uint) (liquidation-ratio uint) (collateral-to-debt-ratio uint) (maximum-debt uint) (liquidation-penalty uint) (stability-fee uint) (stability-fee-decimals uint) (stability-fee-apy uint)) bool))
    
  )
)
