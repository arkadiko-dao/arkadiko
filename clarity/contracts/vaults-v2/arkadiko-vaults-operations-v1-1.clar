;; Vaults Operations 
;; User operations on vaults
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u940401)
(define-constant ERR_WRONG_STATUS u940001)
(define-constant ERR_UNKNOWN_TOKEN u940002)
(define-constant ERR_INVALID_RATIO u940003)
(define-constant ERR_MAX_DEBT_REACHED u940004)

(define-constant STATUS_ACTIVE u101)
(define-constant STATUS_CLOSED_BY_OWNER u102)

;; ---------------------------------------------------------
;; User actions
;; ---------------------------------------------------------

;; TODO: stability fee
;; TODO: do not hardcode contracts

(define-public (open-vault (token principal) (collateral uint) (debt uint) (prev-owner-hint (optional principal)) (next-owner-hint (optional principal)))
  (let (
    (owner tx-sender)
    (nicr (/ (* collateral u100000000) debt))
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))
    (total-debt (get total (contract-call? .arkadiko-vaults-data-v1-1 get-total-debt token)))
    (coll-to-debt (try! (get-collateral-to-debt token collateral debt)))
  )
    (asserts! (not (is-eq (get status vault) STATUS_ACTIVE)) (err ERR_WRONG_STATUS))
    (asserts! (get valid coll-to-debt) (err ERR_INVALID_RATIO))
    (asserts! (< (+ total-debt debt) (get max-debt collateral-info)) (err ERR_MAX_DEBT_REACHED))

    (try! (as-contract (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token STATUS_ACTIVE collateral debt)))
    (try! (as-contract (contract-call? .arkadiko-vaults-sorted-v1-1 insert owner token nicr prev-owner-hint next-owner-hint)))

    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token debt owner)))

    ;; TODO: should be collateral token
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 deposit .arkadiko-token owner collateral)))

    (ok true)
  )
)

(define-public (update-vault (token principal) (collateral uint) (debt uint) (prev-owner-hint (optional principal)) (next-owner-hint (optional principal)))
  (let (
    (owner tx-sender)
    (nicr (/ (* collateral u100000000) debt))
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))
    (total-debt (get total (contract-call? .arkadiko-vaults-data-v1-1 get-total-debt token)))
    (coll-to-debt (try! (get-collateral-to-debt token collateral debt)))
  )
    (asserts! (is-eq (get status vault) STATUS_ACTIVE) (err ERR_WRONG_STATUS))
    (asserts! (get valid coll-to-debt) (err ERR_INVALID_RATIO))
    (asserts! (< (+ (- total-debt (get debt vault)) debt) (get max-debt collateral-info)) (err ERR_MAX_DEBT_REACHED))

    (try! (as-contract (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token STATUS_ACTIVE collateral debt)))
    (try! (as-contract (contract-call? .arkadiko-vaults-sorted-v1-1 reinsert owner token nicr prev-owner-hint next-owner-hint)))

    (if (is-eq debt (get debt vault))
      false
      (if (> debt (get debt vault))
        (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token (- debt (get debt vault)) owner)))
        (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token (- (get debt vault) debt) owner)))
      )
    )

    (if (is-eq collateral (get collateral vault))
      false
      (if (> collateral (get collateral vault))
        ;; TODO: should be collateral token
        (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 deposit .arkadiko-token owner (- collateral (get collateral vault)))))
        (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw .arkadiko-token owner (- (get collateral vault) collateral))))
      )
    )

    (ok true)
  )
)

(define-public (close-vault (token principal))
  (let (
    (owner tx-sender)
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))
  )
    (asserts! (is-eq (get status vault) STATUS_ACTIVE) (err ERR_WRONG_STATUS))

    (try! (as-contract (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token STATUS_CLOSED_BY_OWNER u0 u0)))
    (unwrap-panic (as-contract (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner token)))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token (get debt vault) owner)))

    ;; TODO: should be collateral token
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw .arkadiko-token owner (get collateral vault))))

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Helpers
;; ---------------------------------------------------------

(define-public (get-collateral-to-debt (token principal) (collateral uint) (debt uint))
  (let (
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))
    (price-info (contract-call? .arkadiko-oracle-v2-2 get-price (get token-name collateral-info)))
    (ratio (/ (/ (* collateral (get last-price price-info)) debt) (/ (get decimals price-info) u100)))
  )
    (ok {
      ratio: ratio,
      valid: (> ratio (get liquidation-ratio collateral-info))
    })
  )
)
