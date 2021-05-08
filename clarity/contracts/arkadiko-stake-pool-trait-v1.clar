;; implements a trait that allows collateral of any token (e.g. stx, bitcoin)
(use-trait mock-ft-trait .arkadiko-mock-ft-trait-v1.mock-ft-trait)

(define-trait stake-pool-trait
  (

    ;; Stake asset
    (stake (<mock-ft-trait> principal uint) (response uint uint))

    ;; Unstake asset
    (unstake (<mock-ft-trait> principal uint) (response uint uint))

    ;; Get pending rewards for staker
    (get-pending-rewards (principal) (response uint uint))

    ;; Claim rewards
    (claim-pending-rewards (principal) (response uint uint))

  )
)
