;; Vaults Operations 
;; User operations on vaults
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vaults-tokens-trait .arkadiko-vaults-tokens-trait-v1-1.vaults-tokens-trait)
(use-trait vaults-data-trait .arkadiko-vaults-data-trait-v1-1.vaults-data-trait)
(use-trait vaults-sorted-trait .arkadiko-vaults-sorted-trait-v1-1.vaults-sorted-trait)
(use-trait vaults-pool-active-trait .arkadiko-vaults-pool-active-trait-v1-1.vaults-pool-active-trait)
(use-trait vaults-helpers-trait .arkadiko-vaults-helpers-trait-v1-1.vaults-helpers-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u930401)
(define-constant ERR_WRONG_TRAIT u930402)
(define-constant ERR_SHUTDOWN u930501)
(define-constant ERR_WRONG_STATUS u930001)
(define-constant ERR_UNKNOWN_TOKEN u930002)
(define-constant ERR_INVALID_RATIO u930003)
(define-constant ERR_MAX_DEBT_REACHED u930004)
(define-constant ERR_MIN_DEBT u930005)

(define-constant STATUS_ACTIVE u101)
(define-constant STATUS_CLOSED_BY_OWNER u102)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var shutdown-activated bool false)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-shutdown-activated) 
  (var-get shutdown-activated)
)

;; ---------------------------------------------------------
;; User actions
;; ---------------------------------------------------------

;; Open a new vault
;; Need hints to know where to insert vault in sorted list
(define-public (open-vault 
  (vaults-tokens <vaults-tokens-trait>)
  (vaults-data <vaults-data-trait>)
  (vaults-sorted <vaults-sorted-trait>)
  (vaults-pool-active <vaults-pool-active-trait>)
  (vaults-helpers <vaults-helpers-trait>)
  (oracle <oracle-trait>) 
  (token <ft-trait>) 
  (collateral uint) 
  (debt uint) 
  (prev-owner-hint (optional principal)) 
)
  (let (
    (owner tx-sender)
    (nicr (/ (* collateral u100000000) debt))
    (collateral-info (unwrap! (contract-call? vaults-tokens get-token (contract-of token)) (err ERR_UNKNOWN_TOKEN)))
    (vault (unwrap-panic (contract-call? vaults-data get-vault owner (contract-of token))))
    (total-debt (unwrap-panic (contract-call? vaults-data get-total-debt (contract-of token))))
    (coll-to-debt (try! (contract-call? vaults-helpers get-collateral-to-debt vaults-tokens vaults-data oracle owner (contract-of token) collateral debt)))
  )
    (asserts! (is-eq (contract-of vaults-tokens) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-tokens"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-data) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-data"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-sorted) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-sorted"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-pool-active) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-pool-active"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-helpers) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-helpers"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR_WRONG_TRAIT))
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (not (is-eq (get status vault) STATUS_ACTIVE)) (err ERR_WRONG_STATUS))
    (asserts! (get valid coll-to-debt) (err ERR_INVALID_RATIO))
    (asserts! (< (+ total-debt debt) (get max-debt collateral-info)) (err ERR_MAX_DEBT_REACHED))
    (asserts! (>= debt (get vault-min-debt collateral-info)) (err ERR_MIN_DEBT))

    ;; Save vault data
    (try! (as-contract (contract-call? vaults-data set-vault owner (contract-of token) STATUS_ACTIVE collateral debt)))
    (try! (as-contract (contract-call? vaults-sorted insert owner (contract-of token) nicr prev-owner-hint)))

    ;; Deposit collateral
    (try! (contract-call? vaults-pool-active deposit token owner collateral))

    ;; Mint USDA
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token debt owner)))

    (ok true)
  )
)

;; Update vault
;; Can change collateral and/or debt
;; Need hints to know where to insert vault in sorted list
(define-public (update-vault 
  (vaults-tokens <vaults-tokens-trait>)
  (vaults-data <vaults-data-trait>)
  (vaults-sorted <vaults-sorted-trait>)
  (vaults-pool-active <vaults-pool-active-trait>)
  (vaults-helpers <vaults-helpers-trait>)
  (oracle <oracle-trait>) 
  (token <ft-trait>) 
  (collateral uint) 
  (debt uint) 
  (prev-owner-hint (optional principal)) 
)
  (let (
    (owner tx-sender)
    (stability-fee (try! (contract-call? vaults-helpers get-stability-fee vaults-tokens vaults-data owner (contract-of token))))
    (nicr (/ (* collateral u100000000) debt))
    (collateral-info (unwrap! (contract-call? vaults-tokens get-token (contract-of token)) (err ERR_UNKNOWN_TOKEN)))
    (vault (unwrap-panic (contract-call? vaults-data get-vault owner (contract-of token))))
    (total-debt (unwrap-panic (contract-call? vaults-data get-total-debt (contract-of token))))
    (coll-to-debt (try! (contract-call? vaults-helpers get-collateral-to-debt vaults-tokens vaults-data oracle owner (contract-of token) collateral debt)))
  )
    (asserts! (is-eq (contract-of vaults-tokens) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-tokens"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-data) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-data"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-sorted) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-sorted"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-pool-active) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-pool-active"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-helpers) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-helpers"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR_WRONG_TRAIT))
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (is-eq (get status vault) STATUS_ACTIVE) (err ERR_WRONG_STATUS))
    (asserts! (get valid coll-to-debt) (err ERR_INVALID_RATIO))
    (asserts! (< (+ (- total-debt (get debt vault)) debt) (get max-debt collateral-info)) (err ERR_MAX_DEBT_REACHED))
    (asserts! (>= debt (get vault-min-debt collateral-info)) (err ERR_MIN_DEBT))

    ;; Update vault data
    (try! (as-contract (contract-call? vaults-data set-vault owner (contract-of token) STATUS_ACTIVE collateral debt)))
    (try! (as-contract (contract-call? vaults-sorted reinsert owner (contract-of token) nicr prev-owner-hint)))

    ;; Mint or burn USDA
    (if (is-eq debt (get debt vault))
      false
      (if (> debt (get debt vault))
        (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token (- debt (get debt vault)) owner)))
        (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token (- (get debt vault) debt) owner)))
      )
    )

    ;; Deposit or withdraw collateral
    (if (is-eq collateral (get collateral vault))
      false
      (if (> collateral (get collateral vault))
        (try! (contract-call? vaults-pool-active deposit token owner (- collateral (get collateral vault))))
        (try! (as-contract (contract-call? vaults-pool-active withdraw token owner (- (get collateral vault) collateral))))
      )
    )

    ;; Get stability fees
    (try! (contract-call? .usda-token transfer stability-fee tx-sender .arkadiko-vaults-pool-fees-v1-1 none))

    (ok true)
  )
)

(define-public (close-vault 
  (vaults-tokens <vaults-tokens-trait>) 
  (vaults-data <vaults-data-trait>) 
  (vaults-sorted <vaults-sorted-trait>)
  (vaults-pool-active <vaults-pool-active-trait>)
  (vaults-helpers <vaults-helpers-trait>)
  (token <ft-trait>)
)
  (let (
    (owner tx-sender)
    (vault (unwrap-panic (contract-call? vaults-data get-vault owner (contract-of token))))
    (stability-fee (try! (contract-call? vaults-helpers get-stability-fee vaults-tokens vaults-data owner (contract-of token))))
  )
    (asserts! (is-eq (contract-of vaults-tokens) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-tokens"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-data) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-data"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-sorted) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-sorted"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-pool-active) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-pool-active"))) (err ERR_WRONG_TRAIT))
    (asserts! (is-eq (contract-of vaults-helpers) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-helpers"))) (err ERR_WRONG_TRAIT))
    (asserts! (not (var-get shutdown-activated)) (err ERR_SHUTDOWN))
    (asserts! (is-eq (get status vault) STATUS_ACTIVE) (err ERR_WRONG_STATUS))

    ;; Update vault data
    (try! (as-contract (contract-call? vaults-data set-vault owner (contract-of token) STATUS_CLOSED_BY_OWNER u0 u0)))
    (try! (as-contract (contract-call? vaults-sorted remove owner (contract-of token))))

    ;; Burn all debt
    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token (get debt vault) owner)))

    ;; Get stability fees
    (try! (contract-call? .usda-token transfer stability-fee tx-sender .arkadiko-vaults-pool-fees-v1-1 none))

    ;; Withdraw collateral
    (try! (as-contract (contract-call? vaults-pool-active withdraw token owner (get collateral vault))))

    (ok true)
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
