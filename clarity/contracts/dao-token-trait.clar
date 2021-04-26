(define-trait dao-token-trait
  (
    ;; Mint
    (mint-for-dao (uint principal) (response bool uint))

    ;; Burn
    (burn-for-dao (uint principal) (response bool uint))
  )
)
