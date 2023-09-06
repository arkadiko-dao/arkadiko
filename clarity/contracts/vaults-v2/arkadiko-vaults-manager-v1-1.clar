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
(define-constant ERR_NOT_FIRST_VAULT u920003)
(define-constant ERR_SHOULD_LIQUIDATE u920004)

(define-constant STATUS_ACTIVE u101)
(define-constant STATUS_CLOSED_BY_LIQUIDATION u201)
(define-constant STATUS_CLOSED_BY_REDEMPTION u202)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map redemption-block-last
  { 
    token: principal
  }
  {
    block-last: uint
  }
)

;; ---------------------------------------------------------
;; Getter
;; ---------------------------------------------------------

(define-read-only (get-redemption-block-last (token principal))
  (default-to
    {
      block-last: u0,
    }
    (map-get? redemption-block-last { token: token })
  )
)

;; ---------------------------------------------------------
;; Liquidations
;; ---------------------------------------------------------

;; Liquidate vault
(define-public (liquidate-vault (oracle <oracle-trait>) (owner principal) (token <ft-trait>))
  (let (
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner (contract-of token)))
    (coll-to-debt (try! (contract-call? .arkadiko-vaults-operations-v1-1 get-collateral-to-debt oracle owner (contract-of token) (get collateral vault) (get debt vault))))
    
    (stability-fee (try! (contract-call? .arkadiko-vaults-operations-v1-1 get-stability-fee owner (contract-of token))))
    (new-debt (+ stability-fee (get debt vault)))
    
    (collateral (try! (get-collateral-for-liquidation oracle (contract-of token) (get collateral vault) new-debt)))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR_NOT_AUTHORIZED))
    (asserts! (not (get valid coll-to-debt)) (err ERR_CAN_NOT_LIQUIDATE))

    ;; Update vault data
    (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner (contract-of token) STATUS_CLOSED_BY_LIQUIDATION u0 u0))
    (try! (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner (contract-of token)))

    ;; Burn debt, mint stability fee
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
    (collateral-price (try! (contract-call? oracle fetch-price (get token-name collateral-info))))
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
    (let (
      (leftover-usda (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    )
      (try! (as-contract (contract-call? .arkadiko-swap-v2-1 swap-y-for-x .arkadiko-token .usda-token leftover-usda u0)))
    )

    ;; Burn leftover DIKO
    (let (
      (leftover-diko (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender))))
    )
      (try! (as-contract (contract-call? .arkadiko-dao burn-token .arkadiko-token leftover-diko (as-contract tx-sender))))
    )

    (ok diko-to-mint)
  )
)

;; ---------------------------------------------------------
;; Redemption
;; ---------------------------------------------------------

(define-public (redeem-vault 
  (oracle <oracle-trait>) 
  (owner principal) 
  (token <ft-trait>) 
  (debt-payoff uint)
  (prev-owner-hint (optional principal)) 
  (next-owner-hint (optional principal))
)
  (let (
    (redeemer tx-sender)
    (vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault owner (contract-of token)))
    (token-list (contract-call? .arkadiko-vaults-sorted-v1-1 get-token (contract-of token)))

    (stability-fee (try! (contract-call? .arkadiko-vaults-operations-v1-1 get-stability-fee owner (contract-of token))))
    (debt-total (+ (get debt vault) stability-fee))

    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token (contract-of token)) (err ERR_UNKNOWN_TOKEN)))
    (collateral-price (try! (contract-call? oracle fetch-price (get token-name collateral-info))))
    (collateral-value (/ (* (get collateral vault) (get last-price collateral-price)) (get decimals collateral-price)))

    (debt-payoff-used (if (>= debt-payoff debt-total)
      debt-total
      debt-payoff
    ))
    (debt-left (if (>= debt-payoff debt-total)
      u0
      (- debt-total debt-payoff)
    ))

    (fee-last (get-redemption-block-last (contract-of token)))
    (fee (try! (get-redemption-fee (contract-of token))))
    (new-redemption-last-block (- (get block-last fee-last) (/ debt-payoff-used (get block-rate fee))))

    (collateral-needed (/ (* (get collateral vault) debt-payoff-used) collateral-value))
    (collateral-fee (/ (* collateral-needed (get current-fee fee)) u10000))
    (collateral-received (- collateral-needed collateral-fee))
    
    (collateral-left (- (get collateral vault) collateral-needed))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR_NOT_AUTHORIZED))
    (asserts! (is-eq owner (unwrap-panic (get first-owner token-list))) (err ERR_NOT_FIRST_VAULT))

    (if (is-eq debt-left u0)
      ;; Vault closed
      (begin
        (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token owner collateral-left)))
        (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner (contract-of token) STATUS_CLOSED_BY_REDEMPTION u0 u0))
        (try! (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner (contract-of token)))
      )

      ;; Partial redemption
      (let (
        (nicr (/ (* collateral-left u100000000) debt-left))
      )
        (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner (contract-of token) STATUS_ACTIVE collateral-left (- debt-total debt-payoff)))
        (try! (contract-call? .arkadiko-vaults-sorted-v1-1 reinsert owner (contract-of token) nicr prev-owner-hint next-owner-hint))
      )
    )

    ;; Burn USDA
    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token debt-payoff-used redeemer)))

    ;; Send tokens to redeemer
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token redeemer collateral-received)))

    ;; Get fee
    (try! (as-contract (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token .arkadiko-vaults-pool-fees-v1-1 collateral-fee)))

    ;; Increase redemption fee by decreasing last block
    (map-set redemption-block-last { token: (contract-of token) } 
      { block-last: new-redemption-last-block }
    )
    
    ;; Return 
    (ok { debt-payoff-used: debt-payoff-used, collateral-received: collateral-received, collateral-fee: collateral-fee })
  )
)

;; Get current redemption fee in bps
;; Fee has a min/max and moves between these values
;; Fee goes up on redemption, fee goes down over time
(define-read-only (get-redemption-fee (token principal)) 
  (let (
    (collateral-info (unwrap! (contract-call? .arkadiko-vaults-tokens-v1-1 get-token token) (err ERR_UNKNOWN_TOKEN)))

    (fee-info (get-redemption-block-last token))
    (fee-diff (- (get redemption-fee-max collateral-info) (get redemption-fee-min collateral-info)))
    (block-diff (- block-height (get block-last fee-info)))
    (fee-change (/ (* fee-diff block-diff) (get redemption-fee-block-interval collateral-info)))
    (current-fee (if (>= fee-change fee-diff)
      (get redemption-fee-min collateral-info)
      (- (get redemption-fee-max collateral-info) fee-change)
    ))
  )
    (ok { current-fee: current-fee, block-rate: (get redemption-fee-block-rate collateral-info )})
  )
)
