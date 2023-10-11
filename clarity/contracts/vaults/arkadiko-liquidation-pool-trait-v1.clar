(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-trait liquidation-pool-trait
  (
    (get-shares-at (principal uint) (response uint uint))

    (max-withdrawable-usda () (response uint uint))
    (withdraw (uint) (response uint uint))
  )
)
