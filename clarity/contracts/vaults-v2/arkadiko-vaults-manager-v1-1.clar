;; Vaults Manager 
;; External operations on vaults
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; TODO: dynamic contracts

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u920401)
(define-constant ERR_CAN_NOT_LIQUIDATE u920001)
(define-constant ERR_UNKNOWN_TOKEN u920002)

(define-constant STATUS_CLOSED_BY_LIQUIDATION u201)
(define-constant STATUS_CLOSED_BY_REDEMPTION u202)

;; ---------------------------------------------------------
;; Liquidations
;; ---------------------------------------------------------

;; Liquidate vault
(define-public (liquidate-vault (oracle <oracle-trait>) (owner principal) (token <ft-trait>))
  (let (
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner (contract-of token)))
    (coll-to-debt (try! (contract-call? .arkadiko-vaults-operations-v1-1 get-collateral-to-debt oracle owner (contract-of token) (get collateral vault) (get debt vault))))
    
    (stability-fee (unwrap-panic (contract-call? .arkadiko-vaults-operations-v1-1 get-stability-fee owner (contract-of token))))
    (new-debt (+ stability-fee (get debt vault)))
    
    (collateral (unwrap-panic (get-collateral-for-liquidation oracle (contract-of token) (get collateral vault) new-debt)))
  )
    (asserts! (not (get valid coll-to-debt)) (err ERR_CAN_NOT_LIQUIDATE))

    (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner (contract-of token) STATUS_CLOSED_BY_LIQUIDATION u0 u0))
    (unwrap-panic (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner (contract-of token)))

    ;; Update vault data
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-liquidation-v1-1 burn-usda new-debt)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token stability-fee .arkadiko-vaults-pool-fees-v1-1)))

    ;; Add rewards to liquidation pool
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token tx-sender (get collateral-needed collateral))))
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-liquidation-v1-1 add-rewards token (get collateral-needed collateral))))

    ;; Send leftover back to owner
    (if (> (get collateral-needed collateral) u0)
      (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token owner (get collateral-left collateral))))
      false
    )

    ;; Handle bad debt
    (if (> (get bad-debt collateral) u0)
      (try! (sell-diko (get bad-debt collateral)))
      u0
    )

    (ok true)
  )
)

;; Get collateral amount info to use in liquidation
(define-public (get-collateral-for-liquidation (oracle <oracle-trait>) (token principal) (collateral uint) (debt uint))
  (let (
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))
    (collateral-price (unwrap-panic (contract-call? oracle fetch-price (get token-name collateral-info))))
    (collateral-value (/ (* collateral (get last-price collateral-price)) (get decimals collateral-price)))
    (collateral-needed (/ (* collateral debt) collateral-value))
    (collateral-penalty (/ (* collateral-needed (get liquidation-penalty collateral-info)) u10000))
    (collateral-total (+ collateral-needed collateral-penalty))
  )
    (if (< collateral-value debt)
      (ok { collateral-needed: collateral, collateral-left: u0, bad-debt: (- debt collateral-value)})
      (ok { collateral-needed: collateral-total, collateral-left: (- collateral collateral-total), bad-debt: u0})
    )
  )
)

;; Mint and sell DIKO to cover bad debt
(define-private (sell-diko (debt-left uint))
  (let (
    (pair-details (unwrap-panic (unwrap-panic (contract-call? .arkadiko-swap-v2-1 get-pair-details .arkadiko-token .usda-token))))
    (diko-price (/ (* (get balance-x pair-details) u1100000) (get balance-y pair-details))) ;; 10% extra 
    (diko-to-mint (/ (* debt-left diko-price) u1000000))
  )
    ;; Mint DIKO
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-to-mint (as-contract tx-sender))))

    ;; Swap DIKO to USDA
    (try! (as-contract (contract-call? .arkadiko-swap-v2-1 swap-x-for-y .arkadiko-token .usda-token diko-to-mint u0)))

    ;; Burn USDA
    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token debt-left (as-contract tx-sender))))

    ;; Swap leftover USDA to DIKO
    (let ((leftover-usda (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender)))))
      (try! (as-contract (contract-call? .arkadiko-swap-v2-1 swap-y-for-x .arkadiko-token .usda-token leftover-usda u0)))
    )

    ;; Burn leftover DIKO
    (let ((leftover-diko (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender)))))
      (try! (as-contract (contract-call? .arkadiko-dao burn-token .arkadiko-token leftover-diko (as-contract tx-sender))))
    )

    (ok diko-to-mint)
  )
)

;; ---------------------------------------------------------
;; Redemption
;; ---------------------------------------------------------

(define-public (redeem-vault)
  ;; TODO
  (ok true)
)
