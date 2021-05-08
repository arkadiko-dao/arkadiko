(use-trait mock-ft-trait .arkadiko-mock-ft-trait-v1.mock-ft-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

(define-trait vault-manager-trait
  (
    (get-stx-redeemable () (response uint bool))

    (get-collateral-type-for-vault (uint) (response (string-ascii 12) bool))
    (calculate-current-collateral-to-debt-ratio (uint) (response uint uint))

    (pay-stability-fee (uint) (response bool uint))
    (accrue-stability-fee (uint) (response bool uint))

    (liquidate (uint) (response (tuple (ustx-amount uint) (extra-debt uint) (vault-debt uint) (discount uint)) uint))
    (finalize-liquidation (uint uint) (response bool uint))

    (redeem-auction-collateral (<mock-ft-trait> <vault-trait> uint principal) (response bool uint))

    (get-xusd-balance () (response uint bool))
    (set-stx-redeemable (uint) (response bool uint))
    (set-block-height-last-paid (uint) (response bool uint))
    (set-maximum-debt-surplus (uint) (response bool uint))
  )
)
