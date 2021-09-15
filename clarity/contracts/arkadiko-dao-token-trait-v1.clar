(define-trait dao-token-trait
  (
    ;; Mint - Used by DAO
    (mint-for-dao (uint principal) (response bool uint))

    ;; Burn - Used by DAO
    (burn-for-dao (uint principal) (response bool uint))

    ;; Burn - External usage
    (burn (uint principal) (response bool uint))
  )
)
