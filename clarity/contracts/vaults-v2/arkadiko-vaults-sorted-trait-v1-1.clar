(define-trait vaults-sorted-trait
  (
    (get-token (principal) (response (tuple 
      (first-owner (optional principal)) 
      (last-owner (optional principal))
      (total-vaults uint)
    ) bool))

    (insert (principal principal uint (optional principal)) (response (tuple 
      (first-owner (optional principal)) 
      (last-owner (optional principal))
      (total-vaults uint)
    ) uint))

    (reinsert (principal principal uint (optional principal)) (response (tuple 
      (first-owner (optional principal)) 
      (last-owner (optional principal))
      (total-vaults uint)
    ) uint))

    (remove (principal principal) (response (tuple 
      (first-owner (optional principal)) 
      (last-owner (optional principal))
      (total-vaults uint)
    ) uint))
  )
)
