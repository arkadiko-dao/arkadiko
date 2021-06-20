(define-trait stake-registry-trait
  (
    ;; Pool info
    (get-pool-activated-block (principal) (response uint uint))
    (get-pool-deactivated-block (principal) (response uint uint))

    ;; Current reward per block
    (get-rewards-per-block-for-pool (principal) (response uint uint))

    ;; Mint rewards
    (mint-rewards-for-staker (uint principal) (response uint uint))
  )
)
