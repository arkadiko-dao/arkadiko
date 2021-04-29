(define-trait stacker-trait
  (
    (get-stacking-unlock-burn-height () (response uint bool))
    (initiate-stacking ((tuple (version (buff 1)) (hashbytes (buff 20))) uint uint) (response uint uint))
    (request-stx-for-withdrawal (uint) (response bool uint))
    (payout (uint) (response bool uint))
    (get-stx-balance () (response uint uint))
  )
)
