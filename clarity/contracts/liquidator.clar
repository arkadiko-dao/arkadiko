;; errors
(define-constant ERR-LIQUIDATION-FAILED u51)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u52)
(define-constant STATUS-OK u5200)

(define-public (notify-risky-vault (vault-id uint))
  (let (
    (collateral-type (contract-call? .freddie get-collateral-type-for-vault vault-id))
    (collateral-to-debt-ratio (unwrap-panic (contract-call? .freddie calculate-current-collateral-to-debt-ratio vault-id)))
    (liquidation-ratio (unwrap-panic (contract-call? .dao get-liquidation-ratio collateral-type))))
      (asserts! (is-eq (unwrap-panic (contract-call? .dao get-emergency-shutdown-activated)) false) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
      ;; Vault only at risk when liquidation ratio is < collateral-to-debt-ratio
      (asserts! 
        (>= liquidation-ratio collateral-to-debt-ratio) (err STATUS-OK))
      ;; Start auction
      (print "Vault is in danger. Time to liquidate.")
      (let 
        ((amounts (unwrap-panic (as-contract (contract-call? .freddie liquidate vault-id)))))
          (unwrap! 
            (contract-call? .auction-engine start-auction vault-id (get ustx-amount amounts) (get debt amounts)) 
            (err ERR-LIQUIDATION-FAILED))
          (ok STATUS-OK)
      )
  )
)
