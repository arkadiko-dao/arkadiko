;; Vaults Manager 
;; External operations on vaults
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u920401)
(define-constant ERR_CAN_NOT_LIQUIDATE u920001)

(define-constant STATUS_CLOSED_BY_LIQUIDATION u201)
(define-constant STATUS_CLOSED_BY_REDEMPTION u202)

;; ---------------------------------------------------------
;; Actions
;; ---------------------------------------------------------

(define-public (liquidate-vault (oracle <oracle-trait>) (owner principal) (token principal))
  (let (
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))
    (coll-to-debt (try! (contract-call? .arkadiko-vaults-operations-v1-1 get-collateral-to-debt oracle token (get collateral vault) (get debt vault))))
  )
    (asserts! (not (get valid coll-to-debt)) (err ERR_CAN_NOT_LIQUIDATE))

    ;; TODO: dynamic contracts
    (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token STATUS_CLOSED_BY_LIQUIDATION u0 u0))
    (unwrap-panic (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner token))


    ;; TODO: liquidate
    ;; Take USDA from pool
    ;; Send leftover collateral back to owner
    ;; 

    (ok true)
  )
)

(define-public (redeem-vault)
  (ok true)
)
