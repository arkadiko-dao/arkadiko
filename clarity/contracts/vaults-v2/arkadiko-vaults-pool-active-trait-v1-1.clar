(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-trait vaults-pool-active-trait
  (
    (deposit (<ft-trait> principal uint) (response bool uint))

    (withdraw (<ft-trait> principal uint) (response bool uint))
  )
)
