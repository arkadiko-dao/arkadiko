(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-trait vaults-pool-active-trait
  (
    (deposit (<ft-trait> principal uint) (response bool uint))

    (withdraw (<ft-trait> principal uint) (response bool uint))
  )
)
