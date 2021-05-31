;; implements a trait that allows collateral of any token (e.g. stx, bitcoin)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-trait stake-pool-trait
  (

    ;; Stake asset
    (stake (<ft-trait> principal uint) (response uint uint))

    ;; Unstake asset
    (unstake (<ft-trait> principal uint) (response uint uint))

    ;; Get pending rewards for staker
    (get-pending-rewards (principal) (response uint uint))

    ;; Claim rewards
    (claim-pending-rewards (principal) (response uint uint))

  )
)
