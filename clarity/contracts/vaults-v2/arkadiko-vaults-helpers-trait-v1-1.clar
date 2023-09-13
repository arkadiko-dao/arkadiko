(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait vaults-tokens-trait .arkadiko-vaults-tokens-trait-v1-1.vaults-tokens-trait)
(use-trait vaults-data-trait .arkadiko-vaults-data-trait-v1-1.vaults-data-trait)

(define-trait vaults-helpers-trait
  (
    (get-collateral-to-debt (<vaults-tokens-trait> <vaults-data-trait> <oracle-trait> principal principal uint uint) (response (tuple 
      (ratio uint) 
      (valid bool)
    ) uint))

    (get-stability-fee (<vaults-tokens-trait> <vaults-data-trait> principal principal) (response uint uint))
  )
)
