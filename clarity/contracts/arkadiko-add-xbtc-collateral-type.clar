(define-constant ERR-CANNOT-EXECUTE u301)

;; Phase 3:
;; Enable xBTC as a collateral asset in Arkadiko Vaults. Conditional on 1m+ liquidity is reached in both xBTC pools on the swap. 
;; Initial parameters for the Vault would be:
;;  LTV: 25% (~400% collateralisation ratio)
;;  Yearly Stability Fee: 3%
;;  Liquidation Penalty: 10%
;;  Debt Ceiling: 100M
;;  Liquidation Ratio: 150%
(define-public (add-xbtc-collateral-type)
  (let (
    (proposal (contract-call? .arkadiko-governance-v2-1 get-proposal-by-id u4))
  )
    (asserts! (> (get yes-votes proposal) (get no-votes proposal)) (err ERR-CANNOT-EXECUTE))

    ;; TODO
    ;; (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters))
    (ok true)
  )
)
