(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vaults-tokens-trait .arkadiko-vaults-tokens-trait-v1-1.vaults-tokens-trait)

(define-trait vaults-pool-liq-trait
  (
    (add-rewards (<vaults-tokens-trait> <ft-trait> uint) (response uint uint))

    (burn-usda (uint) (response uint uint))
  )
)
