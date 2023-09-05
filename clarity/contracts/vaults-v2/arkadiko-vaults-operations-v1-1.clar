;; Vaults Operations 
;; User operations on vaults
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u930401)
(define-constant ERR_WRONG_STATUS u930001)
(define-constant ERR_UNKNOWN_TOKEN u930002)
(define-constant ERR_INVALID_RATIO u930003)
(define-constant ERR_MAX_DEBT_REACHED u930004)

(define-constant STATUS_ACTIVE u101)
(define-constant STATUS_CLOSED_BY_OWNER u102)

;; ---------------------------------------------------------
;; User actions
;; ---------------------------------------------------------

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

    (stability-fee (unwrap-panic (get-stability-fee owner token)))
    (new-debt (+ stability-fee debt))

    (nicr (/ (* collateral u100000000) new-debt))

    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))
    (total-debt (get total (contract-call? .arkadiko-vaults-data-v1-1 get-total-debt token)))
    (coll-to-debt (try! (get-collateral-to-debt token collateral new-debt)))
  )
    (asserts! (is-eq (get status vault) STATUS_ACTIVE) (err ERR_WRONG_STATUS))
    (asserts! (get valid coll-to-debt) (err ERR_INVALID_RATIO))
    (asserts! (< (+ (- total-debt (get debt vault)) new-debt) (get max-debt collateral-info)) (err ERR_MAX_DEBT_REACHED))

    (try! (as-contract (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token STATUS_ACTIVE collateral new-debt)))
    (try! (as-contract (contract-call? .arkadiko-vaults-sorted-v1-1 reinsert owner token nicr prev-owner-hint next-owner-hint)))

    (if (is-eq new-debt (get debt vault))
      false
      (if (> new-debt (get debt vault))
        (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token (- new-debt (get debt vault)) owner)))
        (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token (- (get debt vault) new-debt) owner)))
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

    ;; 
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token stability-fee tx-sender)))

    (ok true)
  )
)

(define-public (close-vault (token principal))
  (let (
    (owner tx-sender)
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))

    (stability-fee (unwrap-panic (get-stability-fee owner token)))
    (new-debt (+ stability-fee (get debt vault)))
  )
    (asserts! (is-eq (get status vault) STATUS_ACTIVE) (err ERR_WRONG_STATUS))

    (try! (as-contract (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token STATUS_CLOSED_BY_OWNER u0 u0)))
    (unwrap-panic (as-contract (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner token)))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token new-debt owner)))

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

(define-public (get-stability-fee (owner principal) (token principal))
  (let (
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner token))
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))

    (vault-blocks (- block-height (get last-block vault)))
  )
    ;; 4% fee, per (144*365) blocks

    (ok u1)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (withdraw-stability-fee)
  (let (
    (receiver tx-sender)
    (balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
  )
    ;; TODO: access control
    (try! (as-contract (contract-call? .usda-token transfer balance tx-sender receiver none)))
    (ok balance)
  )
)
