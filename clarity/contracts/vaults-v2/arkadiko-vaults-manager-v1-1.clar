;; Vaults Manager 
;; External operations on vaults (liquidation & redemption)
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vaults-tokens-trait .arkadiko-vaults-tokens-trait-v1-1.vaults-tokens-trait)
(use-trait vaults-data-trait .arkadiko-vaults-data-trait-v1-1.vaults-data-trait)
(use-trait vaults-sorted-trait .arkadiko-vaults-sorted-trait-v1-1.vaults-sorted-trait)
(use-trait vaults-pool-active-trait .arkadiko-vaults-pool-active-trait-v1-1.vaults-pool-active-trait)
(use-trait vaults-pool-liq-trait .arkadiko-vaults-pool-liq-trait-v1-1.vaults-pool-liq-trait)
(use-trait vaults-helpers-trait .arkadiko-vaults-helpers-trait-v1-1.vaults-helpers-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u920401)
(define-constant ERR_WRONG_TRAIT u920402)
(define-constant ERR_SHUTDOWN u920501)
(define-constant ERR_CAN_NOT_LIQUIDATE u920001)
(define-constant ERR_UNKNOWN_TOKEN u920002)
(define-constant ERR_NOT_FIRST_VAULT u920003)

(define-constant STATUS_ACTIVE u101)
(define-constant STATUS_CLOSED_BY_LIQUIDATION u201)
(define-constant STATUS_CLOSED_BY_REDEMPTION u202)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var shutdown-activated bool false)

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

(define-read-only (get-shutdown-activated) 
  (var-get shutdown-activated)
)

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
(define-public (liquidate-vault 
  (vaults-tokens <vaults-tokens-trait>) 
  (vaults-data <vaults-data-trait>) 
  (vaults-sorted <vaults-sorted-trait>)
  (vaults-pool-active <vaults-pool-active-trait>)
  (vaults-pool-liq <vaults-pool-liq-trait>)
  (vaults-helpers <vaults-helpers-trait>)
  (oracle <oracle-trait>) 
  (owner principal) 
  (token <ft-trait>)
)
  (let (
    (vault (unwrap-panic (contract-call? vaults-data get-vault owner (contract-of token))))
    (coll-to-debt (try! (contract-call? vaults-helpers get-collateral-to-debt vaults-tokens vaults-data oracle owner (contract-of token) (get collateral vault) (get debt vault))))
    
    (stability-fee (try! (contract-call? vaults-helpers get-stability-fee vaults-tokens vaults-data owner (contract-of token))))
    (new-debt (+ stability-fee (get debt vault)))
    
    (collateral (try! (get-collateral-for-liquidation vaults-tokens oracle (contract-of token) (get collateral vault) new-debt)))
  )
    (asserts! (is-eq (contract-of vaults-tokens) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-tokens"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-data) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-data"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-sorted) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-sorted"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-pool-active) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-pool-active"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-pool-liq) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-pool-liq"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-helpers) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-helpers"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR_WRONG_TRAIT))
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (not (get valid coll-to-debt)) (err ERR_CAN_NOT_LIQUIDATE))

    ;; Update vault data
    (try! (contract-call? vaults-data set-vault owner (contract-of token) STATUS_CLOSED_BY_LIQUIDATION u0 u0))
    (try! (contract-call? vaults-sorted remove owner (contract-of token)))

    ;; Burn debt, mint stability fee
    (try! (as-contract (contract-call? vaults-pool-liq burn-usda new-debt)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token stability-fee .arkadiko-vaults-pool-fees-v1-1)))

    ;; Add rewards to liquidation pool
    (try! (as-contract (contract-call? vaults-pool-active withdraw token tx-sender (get collateral-needed collateral))))
    (try! (as-contract (contract-call? vaults-pool-liq add-rewards vaults-tokens token (get collateral-needed collateral))))

    ;; Send leftover back to owner
    (if (> (get collateral-left collateral) u0)
      (try! (as-contract (contract-call? vaults-pool-active withdraw token owner (get collateral-left collateral))))
      false
    )

    (ok true)
  )
)

;; Get collateral amount info to use in liquidation
(define-public (get-collateral-for-liquidation (vaults-tokens <vaults-tokens-trait>) (oracle <oracle-trait>) (token principal) (collateral uint) (debt uint))
  (let (
    (collateral-info (unwrap! (contract-call? vaults-tokens get-token token) (err ERR_UNKNOWN_TOKEN)))
    (collateral-price (try! (contract-call? oracle fetch-price (get token-name collateral-info))))
    (collateral-value (/ (* collateral (get last-price collateral-price)) (get decimals collateral-price)))
    (collateral-needed (/ (* collateral debt) collateral-value))
    (collateral-penalty (/ (* collateral-needed (get liquidation-penalty collateral-info)) u10000))
    (collateral-total (+ collateral-needed collateral-penalty))
  )
    (if (>= collateral-total collateral)
      (ok { collateral-needed: collateral, collateral-left: u0 })
      (ok { collateral-needed: collateral-total, collateral-left: (- collateral collateral-total) })
    )
  )
)

;; ---------------------------------------------------------
;; Redemption
;; ---------------------------------------------------------

(define-public (redeem-vault 
  (vaults-tokens <vaults-tokens-trait>)
  (vaults-data <vaults-data-trait>)
  (vaults-sorted <vaults-sorted-trait>)
  (vaults-pool-active <vaults-pool-active-trait>)
  (vaults-helpers <vaults-helpers-trait>)
  (oracle <oracle-trait>) 
  (owner principal) 
  (token <ft-trait>) 
  (debt-payoff uint)
  (prev-owner-hint (optional principal)) 
)
  (let (
    (redeemer tx-sender)
    (vault (unwrap-panic (contract-call? vaults-data get-vault owner (contract-of token))))
    (token-list (unwrap-panic (contract-call? vaults-sorted get-token (contract-of token))))

    (collateral-info (unwrap! (contract-call? vaults-tokens get-token (contract-of token)) (err ERR_UNKNOWN_TOKEN)))
    (collateral-price (try! (contract-call? oracle fetch-price (get token-name collateral-info))))
    (collateral-value (/ (* (get collateral vault) (get last-price collateral-price)) (get decimals collateral-price)))

    (stability-fee (try! (contract-call? vaults-helpers get-stability-fee vaults-tokens vaults-data owner (contract-of token))))
    (debt-total (+ (get debt vault) stability-fee))

    (debt-payoff-used (if (>= debt-payoff debt-total)
      debt-total
      debt-payoff
    ))
    (debt-left (if (>= debt-payoff debt-total)
      u0
      (- debt-total debt-payoff)
    ))

    (fee (try! (get-redemption-fee vaults-tokens (contract-of token))))
    (fee-block-last (get block-last (get-redemption-block-last (contract-of token))))
    (fee-block-last-cap (if (< fee-block-last (- burn-block-height (get redemption-fee-block-interval collateral-info))) 
      (- burn-block-height (get redemption-fee-block-interval collateral-info)) 
      fee-block-last
    ))
    (fee-block-change (/ debt-payoff-used (get redemption-fee-block-rate collateral-info)))
    (new-redemption-last-block (+ fee-block-last-cap fee-block-change))

    (collateral-needed (/ (* (get collateral vault) debt-payoff-used) collateral-value))
    (collateral-fee (/ (* collateral-needed (get current-fee fee)) u10000))
    (collateral-received (- collateral-needed collateral-fee))
    
    (collateral-left (- (get collateral vault) collateral-needed))
  )
    (asserts! (is-eq (contract-of vaults-tokens) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-tokens"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-data) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-data"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-sorted) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-sorted"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-pool-active) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-pool-active"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-helpers) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-helpers"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR_WRONG_TRAIT))
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (is-eq owner (unwrap-panic (get first-owner token-list))) (err ERR_NOT_FIRST_VAULT))

    (if (is-eq debt-left u0)
      ;; Vault closed
      (begin
        (try! (as-contract (contract-call? vaults-pool-active withdraw token owner collateral-left)))
        (try! (contract-call? vaults-data set-vault owner (contract-of token) STATUS_CLOSED_BY_REDEMPTION u0 u0))
        (try! (contract-call? vaults-sorted remove owner (contract-of token)))
      )

      ;; Partial redemption
      (let (
        (nicr (/ (* collateral-left u100000000) debt-left))
      )
        (try! (contract-call? vaults-data set-vault owner (contract-of token) STATUS_ACTIVE collateral-left debt-left))
        (try! (contract-call? vaults-sorted reinsert owner (contract-of token) nicr prev-owner-hint))
      )
    )

    ;; Burn USDA
    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token debt-payoff-used redeemer)))

    ;; Send tokens to redeemer
    (try! (as-contract (contract-call? vaults-pool-active withdraw token redeemer collateral-received)))

    ;; Get fee
    (try! (as-contract (contract-call? vaults-pool-active withdraw token .arkadiko-vaults-pool-fees-v1-1 collateral-fee)))

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
(define-public (get-redemption-fee (vaults-tokens <vaults-tokens-trait>) (token principal)) 
  (let (
    (collateral-info (unwrap! (contract-call? vaults-tokens get-token token) (err ERR_UNKNOWN_TOKEN)))
    (fee-info (get-redemption-block-last token))
    (fee-diff (- (get redemption-fee-max collateral-info) (get redemption-fee-min collateral-info)))
    (block-diff (- burn-block-height (get block-last fee-info)))
    (fee-change (/ (* fee-diff block-diff) (get redemption-fee-block-interval collateral-info)))
    (current-fee (if (>= fee-change fee-diff)
      (get redemption-fee-min collateral-info)
      (- (get redemption-fee-max collateral-info) fee-change)
    ))
  )
    (ok { current-fee: current-fee })
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-shutdown-activated (activated bool))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (var-set shutdown-activated activated)

    (ok true)
  )
)
