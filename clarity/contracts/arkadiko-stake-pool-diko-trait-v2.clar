;; @contract DIKO Pool Trait
;; @version 2.0

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vest-esdiko-trait .arkadiko-vest-esdiko-trait-v1.vest-esdiko-trait)

(define-trait stake-pool-diko-trait
  (
    ;; Stake
    (stake (<ft-trait> uint <vest-esdiko-trait>) (response uint uint))

    ;; Unstake
    (unstake (<ft-trait> uint <vest-esdiko-trait>) (response uint uint))

    ;; Claim
    (claim-pending-rewards () (response bool uint))

    ;; DIKO/stDIKO ratio (from trait V1, to not break governance contract)
    (diko-stdiko-ratio () (response uint uint))
  )
)