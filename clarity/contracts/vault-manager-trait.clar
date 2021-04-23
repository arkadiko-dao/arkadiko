(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)
(use-trait vault-trait .vault-trait.vault-trait)

(define-trait vault-manager-trait
  (
    (fetch-vault-by-id (uint) (response (tuple (id uint) (owner principal) (collateral uint) (collateral-type (string-ascii 12)) (collateral-token (string-ascii 12)) (stacked-tokens uint) (revoked-stacking bool) (debt uint) (created-at-block-height uint) (updated-at-block-height uint) (stability-fee uint) (stability-fee-last-accrued uint) (is-liquidated bool) (auction-ended bool) (leftover-collateral uint)) bool))
    (get-stx-redeemable () (response uint bool))
    (get-last-vault-id () (response uint uint))

    (get-collateral-type-for-vault (uint) (response (string-ascii 12) bool))
    (calculate-current-collateral-to-debt-ratio (uint) (response uint uint))

    (liquidate (uint) (response (tuple (ustx-amount uint) (debt uint)) uint))
    (finalize-liquidation (uint uint) (response bool uint))

    (redeem-auction-collateral (<mock-ft-trait> <vault-trait> uint principal) (response bool uint))

    (get-xusd-balance () (response uint bool))
  )
)
