;; @contract Auction Engine trait 
;; @version 1

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)

(define-trait auction-engine-trait
  (
    (get-minimum-collateral-amount (<oracle-trait> uint) (response uint uint))
    (start-auction (uint uint uint uint uint) (response bool uint))
  )
)
