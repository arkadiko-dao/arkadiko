(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-trait liquidation-pool-trait
  (
    (get-shares-at (principal uint) (response uint uint))
    (withdraw (uint) (response uint uint))
  )
)
