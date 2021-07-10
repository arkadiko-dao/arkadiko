(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

(define-trait stacker-trait
  (
    (get-stacking-stx-stacked () (response uint bool))
    (get-stacking-unlock-burn-height () (response uint bool))
    (initiate-stacking ((tuple (version (buff 1)) (hashbytes (buff 20))) uint uint) (response uint uint))
    (request-stx-for-withdrawal (uint) (response bool uint))
    ;; TODO: (payout (uint <ft-trait> <ft-trait> <collateral-types-trait> <vault-trait> <ft-trait>) (response bool uint))
    (get-stx-balance () (response uint uint))
  )
)
