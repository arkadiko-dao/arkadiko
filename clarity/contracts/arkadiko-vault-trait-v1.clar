;; implements a trait that allows collateral of any token (e.g. stx, bitcoin)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

(define-trait vault-trait
  (
    ;; calculate stablecoin count to mint from posted collateral
    (calculate-xusd-count ((string-ascii 12) uint uint <oracle-trait>) (response uint uint))

    ;; calculate the current collateral to debt ratio against USD value of collateral
    (calculate-current-collateral-to-debt-ratio ((string-ascii 12) uint uint <oracle-trait>) (response uint uint))

    ;; collateralize tokens and mint stablecoin according to collateral-to-debt ratio
    (collateralize-and-mint (<ft-trait> (string-ascii 12) uint uint principal) (response uint uint))

    ;; deposit extra collateral
    (deposit (<ft-trait> (string-ascii 12) uint) (response bool uint))

    ;; withdraw excess collateral
    (withdraw (<ft-trait> (string-ascii 12) principal uint) (response bool uint))

    ;; mint additional stablecoin
    (mint ((string-ascii 12) principal uint uint uint uint <oracle-trait>) (response bool uint))

    ;; burn all the stablecoin in the vault of tx-sender and return collateral
    (burn (<ft-trait> principal uint) (response bool uint))

    ;; liquidate the vault of principal. only callable by liquidator smart contract
    ;; (liquidate (uint uint) (response (tuple (ustx-amount uint) (debt uint)) uint))

    ;; redeem collateral after an auction ran
    (redeem-collateral (<ft-trait> (string-ascii 12) uint principal) (response bool uint))

    (set-tokens-to-stack (uint) (response bool uint))
  )
)
