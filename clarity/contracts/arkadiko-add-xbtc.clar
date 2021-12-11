;; Phase 1
;; First xBTC liquidity pool is added to Arkadiko Swap: xBTC/STX 
;; New weights on emissions sinks:
;;  10% stDIKO
;;  15% STX/DIKO
;;  25% DIKO/USDA
;;  10% xBTC/STX
;;  40% STX/USDA
(define-public (add-xbtc-stx)
  (let (
    (proposal (contract-call? .arkadiko-governance-v2-1 get-proposal-by-id u4))
  )
    (ok true)
  )
)

;; Phase 2:
;; Second xBTC liquidity pool is added once xBTC/STX has sufficient liquidity (1m+): xBTC/USDA
;; New weights on emissions sinks:
;;  10% stDIKO
;;  15% STX/DIKO
;;  25% DIKO/USDA
;;  5% xBTC/STX
;;  10% xBTC/USDA
;;  35% STX/USDA
(define-public (add-xbtc-usda)
  (ok true)
)

;; Phase 3:
;; Enable xBTC as a collateral asset in Arkadiko Vaults. Conditional on 1m+ liquidity is reached in both xBTC pools on the swap. 
;; Initial parameters for the Vault would be:
;;  LTV: 25% (~400% collateralisation ratio)
;;  Yearly Stability Fee: 3%
;;  Liquidation Penalty: 10%
;;  Debt Ceiling: 100M
;;  Liquidation Ratio: 150%
(define-public (add-xbtc-collateral-type)
  (ok true)
)
