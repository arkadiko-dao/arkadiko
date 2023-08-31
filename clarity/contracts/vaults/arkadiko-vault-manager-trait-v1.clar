(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

(define-trait vault-manager-trait
  (
    (get-stx-redeemable () (response uint bool))

    (get-collateral-type-for-vault (uint) (response (string-ascii 12) bool))
    (calculate-current-collateral-to-debt-ratio (uint <collateral-types-trait> <oracle-trait> bool) (response uint uint))

    (pay-stability-fee (uint <collateral-types-trait>) (response uint uint))
    (accrue-stability-fee (uint <collateral-types-trait>) (response bool uint))

    (liquidate (uint <collateral-types-trait>) (response (tuple (ustx-amount uint) (extra-debt uint) (vault-debt uint) (discount uint)) uint))
    (finalize-liquidation (uint uint <collateral-types-trait>) (response bool uint))

    (redeem-auction-collateral (<ft-trait> (string-ascii 12) <vault-trait> uint principal) (response bool uint))

    (get-usda-balance () (response uint bool))
    (set-stx-redeemable (uint) (response bool uint))
    (set-block-height-last-paid (uint) (response bool uint))
    (set-maximum-debt-surplus (uint) (response bool uint))
  )
)
