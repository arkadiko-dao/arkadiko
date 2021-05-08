(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)

(define-trait auction-engine-trait
  (
    ;; make this part of the trait when bug is fixed: (get-minimum-collateral-amount (<oracle-trait> uint) (response uint bool))
    (fetch-minimum-collateral-amount (<oracle-trait> uint) (response uint uint))
    (start-auction (uint uint uint uint uint) (response bool uint))
  )
)
