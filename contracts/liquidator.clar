;; errors
(define-constant err-liquidation-failed u1)

;; only callable by a registered stacker
(define-public (notify-risky-reserve (vault-address principal))
  (let ((collateral-to-debt-ratio (unwrap-panic (contract-call? .stx-reserve calculate-current-collateral-to-debt-ratio vault-address))))
    (let ((liquidation-ratio (contract-call? .stx-reserve get-liquidation-ratio)))
      (if (> collateral-to-debt-ratio (unwrap-panic liquidation-ratio))
        (begin
          (print "Vault is in danger. Time to liquidate.")
          (let ((stx-collateral (unwrap-panic (as-contract (contract-call? .stx-reserve liquidate vault-address)))))
            (if
              (and
                (is-some stx-collateral)
                (unwrap-panic (start-auction (unwrap-panic stx-collateral)))
              )
              (ok true)
              (err err-liquidation-failed)
            )
          )
        )
        (ok true) ;; false alarm - vault is not at risk. just return successful response
      )
    )
  )
)

(define-private (start-auction (stx-collateral uint))
  (ok true)
)
