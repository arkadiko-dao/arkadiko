;; Vaults Helpers 
;; Helper methods used by multiple contracts (manager, operations)
;;

(impl-trait .arkadiko-vaults-helpers-trait-v1-1.vaults-helpers-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait vaults-tokens-trait .arkadiko-vaults-tokens-trait-v1-1.vaults-tokens-trait)
(use-trait vaults-data-trait .arkadiko-vaults-data-trait-v1-1.vaults-data-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_UNKNOWN_TOKEN u980001)

;; ---------------------------------------------------------
;; Helpers
;; ---------------------------------------------------------

;; Get collateral to debt ratio
;; Get if ratio is valid (ratio > liquidation ratio)
(define-public (get-collateral-to-debt (vaults-tokens <vaults-tokens-trait>) (vaults-data <vaults-data-trait>) (oracle <oracle-trait>) (owner principal) (token principal) (collateral uint) (debt uint))
  (let (
    (collateral-info (unwrap! (contract-call? vaults-tokens get-token token) (err ERR_UNKNOWN_TOKEN)))
    (price-info (try! (contract-call? oracle fetch-price (get token-name collateral-info))))

    (stability-fee (try! (get-stability-fee vaults-tokens vaults-data owner token)))
    (ratio (/ (/ (* collateral (get last-price price-info) u100) (+ debt stability-fee)) (/ (get decimals price-info) u100)))
  )
    (ok {
      ratio: ratio,
      valid: (>= ratio (get liquidation-ratio collateral-info))
    })
  )
)

;; Get owed stability fees
(define-public (get-stability-fee (vaults-tokens <vaults-tokens-trait>) (vaults-data <vaults-data-trait>) (owner principal) (token principal))
  (let (
    (vault (unwrap-panic (contract-call? vaults-data get-vault owner token)))
    (collateral-info (unwrap! (contract-call? vaults-tokens get-token token) (err ERR_UNKNOWN_TOKEN)))

    (vault-blocks (- burn-block-height (get last-block vault)))
  )
    (ok (/ (* (/ (* (get stability-fee collateral-info) (get debt vault)) u10000) vault-blocks) (* u144 u365)))
  )
)
