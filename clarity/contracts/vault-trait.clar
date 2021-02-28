;; implements a trait that allows collateral of any token (e.g. stx, bitcoin)
(define-trait vault-trait
  (
    ;; calculate stablecoin count to mint from posted collateral
    (calculate-arkadiko-count (uint) (response uint uint))

    ;; calculate the current collateral to debt ratio against USD value of collateral
    (calculate-current-collateral-to-debt-ratio (principal) (response uint uint))

    ;; collateralize tokens and mint stablecoin according to collateral-to-debt ratio
    (collateralize-and-mint (uint principal) (response uint uint))

    ;; burn all the stablecoin in the vault of tx-sender and return collateral
    (burn () (response bool uint))

    ;; liquidate the vault of principal. only callable by liquidator smart contract
    (liquidate (principal) (response uint uint))
  )
)
