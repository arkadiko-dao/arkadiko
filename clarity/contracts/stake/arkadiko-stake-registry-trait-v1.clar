(define-trait stake-registry-trait
  (
    ;; Pool deactivated block
    (get-pool-deactivated-block (principal) (response uint uint))

    ;; Current reward per block
    (get-rewards-per-block-for-pool (principal) (response uint uint))
  )
)
