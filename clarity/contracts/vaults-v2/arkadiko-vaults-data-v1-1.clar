;; Vaults Data 
;; Store vault data, indexed by owner + token
;;

(impl-trait .arkadiko-vaults-data-trait-v1-1.vaults-data-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u910401)

(define-constant STATUS_INACTIVE u100)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map vaults 
  { 
    owner: principal,
    token: principal 
  } 
  {
    status: uint,
    collateral: uint,
    debt: uint,
    last-block: uint,
  }
)

(define-map total-debt
  { 
    token: principal
  }
  {
    total: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-vault (owner principal) (token principal))
  (ok (default-to
    {
      status: STATUS_INACTIVE,
      collateral: u0,
      debt: u0,
      last-block: u0
    }
    (map-get? vaults { owner: owner, token: token })
  ))
)

(define-read-only (get-total-debt (token principal))
  (ok (get total (default-to
    {
      total: u0
    }
    (map-get? total-debt { token: token })
  )))
)

;; ---------------------------------------------------------
;; Setters
;; ---------------------------------------------------------

(define-public (set-vault (owner principal) (token principal) (status uint) (collateral uint) (debt uint))
  (let (
    (current-vault (unwrap-panic (get-vault owner token)))
    (nicr (if (> debt u0)
      (/ (* collateral u100000000) debt)
      u0
    ))
  )
    (asserts! (or
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-migration")))
      (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner))
    ) (err ERR_NOT_AUTHORIZED))

    ;; Update vaults data
    (map-set vaults { owner: owner, token: token }
      { status: status, collateral: collateral, debt: debt, last-block: burn-block-height }
    )

    ;; Update total debt for token
    (map-set total-debt { token: token }
      { total: (+ (- (unwrap-panic (get-total-debt token)) (get debt current-vault)) debt) }
    )

    (print { action: "vaults-set", owner: owner, token: token, status: status, collateral: collateral, debt: debt, last-block: burn-block-height, nicr: nicr })

    (ok true)
  )
)
