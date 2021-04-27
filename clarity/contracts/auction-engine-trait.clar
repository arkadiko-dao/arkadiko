(use-trait oracle-trait .oracle-trait.oracle-trait)
(use-trait vault-manager-trait .vault-manager-trait.vault-manager-trait)

(define-trait auction-engine-trait
  (
    ;; make this part of the trait when bug is fixed: (get-minimum-collateral-amount (<oracle-trait> uint) (response uint bool))
    (fetch-minimum-collateral-amount (<oracle-trait> uint) (response uint uint))
    (start-auction (uint uint uint) (response bool uint))
  )
)
