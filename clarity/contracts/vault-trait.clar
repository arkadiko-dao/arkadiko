;; implements a trait that allows collateral of any token (e.g. stx, bitcoin)
(define-trait vault-trait
  (
    ;; calculate stablecoin count to mint from posted collateral
    (calculate-xusd-count (uint) (response uint uint))

    ;; calculate the current collateral to debt ratio against USD value of collateral
    (calculate-current-collateral-to-debt-ratio (uint uint) (response uint uint))

    ;; collateralize tokens and mint stablecoin according to collateral-to-debt ratio
    (collateralize-and-mint (uint uint principal) (response uint uint))

    ;; deposit extra collateral
    (deposit (uint) (response bool uint))

    ;; withdraw excess collateral
    (withdraw (principal uint) (response bool uint))

    ;; mint additional stablecoin
    (mint (principal uint uint uint) (response bool uint))

    ;; burn all the stablecoin in the vault of tx-sender and return collateral
    (burn (principal uint) (response bool uint))

    ;; liquidate the vault of principal. only callable by liquidator smart contract
    (liquidate (uint uint) (response (tuple (ustx-amount uint) (debt uint)) uint))

    ;; redeem collateral after an auction ran
    (redeem-collateral (uint principal) (response bool uint))
  )
)
