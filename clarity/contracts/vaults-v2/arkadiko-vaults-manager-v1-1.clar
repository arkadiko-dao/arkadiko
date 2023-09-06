;; Vaults Manager 
;; External operations on vaults
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

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

(define-public (liquidate-vault (oracle <oracle-trait>) (owner principal) (token <ft-trait>))
  (let (
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner (contract-of token)))
    (coll-to-debt (try! (contract-call? .arkadiko-vaults-operations-v1-1 get-collateral-to-debt oracle owner (contract-of token) (get collateral vault) (get debt vault))))
    
    (stability-fee (unwrap-panic (contract-call? .arkadiko-vaults-operations-v1-1 get-stability-fee owner (contract-of token))))
    (new-debt (+ stability-fee (get debt vault)))
    
    (collateral-liquidated (unwrap-panic (get-collateral-for-liquidation oracle (contract-of token) (get collateral vault) new-debt)))
    (collateral-leftover (- (get collateral vault) collateral-liquidated))
  )
    (asserts! (not (get valid coll-to-debt)) (err ERR_CAN_NOT_LIQUIDATE))

    ;; TODO: dynamic contracts
    (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner (contract-of token) STATUS_CLOSED_BY_LIQUIDATION u0 u0))
    (unwrap-panic (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner (contract-of token)))


    (try! (contract-call? .arkadiko-vaults-pool-liquidation-v1-1 burn-usda new-debt))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token stability-fee .arkadiko-vaults-pool-fees-v1-1)))

    (try! (contract-call? .arkadiko-vaults-pool-liquidation-v1-1 add-rewards token collateral-liquidated))
    (try! (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token owner collateral-leftover))

    (ok true)
  )
)

(define-public (get-collateral-for-liquidation (oracle <oracle-trait>) (token principal) (collateral uint) (debt uint))
  (let (
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))
    (collateral-price (unwrap-panic (contract-call? oracle fetch-price (get token-name collateral-info))))
  )
    ;; TODO: actual calculation
    ;; How much collateral is needed to cover debt?
    ;; At liquidation penalty

    (ok (/ (* collateral (get last-price collateral-price)) (/ (get decimals collateral-price) u100)))
  )
)

;; ---------------------------------------------------------
;; Redemption
;; ---------------------------------------------------------

(define-public (redeem-vault)
  (ok true)
)
