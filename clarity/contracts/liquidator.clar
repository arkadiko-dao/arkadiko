;; errors
(define-constant err-liquidation-failed u1)
(define-constant confirm-action u200)

(define-public (notify-risky-vault (vault-id uint))
  (let (
    (collateral-type (contract-call? .freddie get-collateral-type-for-vault vault-id))
    (collateral-to-debt-ratio (unwrap-panic (contract-call? .freddie calculate-current-collateral-to-debt-ratio vault-id)))
    (liquidation-ratio (unwrap-panic (contract-call? .dao get-liquidation-ratio collateral-type))))
      ;; Vault only at risk when liquidation ratio is < collateral-to-debt-ratio
      (asserts! 
        (>= liquidation-ratio collateral-to-debt-ratio) (err confirm-action))
      ;; Start auction
      (print "Vault is in danger. Time to liquidate.")
      (let 
        ((amounts (unwrap-panic (as-contract (contract-call? .freddie liquidate vault-id)))))
          (unwrap! 
            (contract-call? .auction-engine start-auction vault-id (get ustx-amount amounts) (get debt amounts)) 
            (err err-liquidation-failed))
          (ok confirm-action)
      )
  )
)
