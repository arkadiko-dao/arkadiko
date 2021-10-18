(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait stake-registry-trait .arkadiko-stake-registry-trait-v1.stake-registry-trait)

(define-trait stake-pool-trait
  (

    ;; Stake asset
    (stake (<stake-registry-trait> <ft-trait> principal uint) (response uint uint))

    ;; Unstake asset
    (unstake (<stake-registry-trait> <ft-trait> principal uint) (response uint uint))

    ;; Get pending rewards for staker
    (get-pending-rewards (<stake-registry-trait> principal) (response uint uint))

    ;; Claim rewards
    (claim-pending-rewards (<stake-registry-trait> principal) (response uint uint))

  )
)
