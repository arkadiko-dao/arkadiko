;; Vaults Data 
;; Store vault data
;;

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
  (default-to
    {
      status: STATUS_INACTIVE,
      collateral: u0,
      debt: u0,
      last-block: u0
    }
    (map-get? vaults { owner: owner, token: token })
  )
)

(define-read-only (get-total-debt (token principal))
  (default-to
    {
      total: u0
    }
    (map-get? total-debt { token: token })
  )
)

;; ---------------------------------------------------------
;; Setters
;; ---------------------------------------------------------

(define-public (set-vault (owner principal) (token principal) (status uint) (collateral uint) (debt uint))
  (let (
    (current-vault (get-vault owner token))
  )
    (asserts! (or
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
      (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
      (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner))
    ) (err ERR_NOT_AUTHORIZED))

    (map-set vaults
      { 
        owner: owner,
        token: token
      }
      {
        status: status,
        collateral: collateral,
        debt: debt,
        last-block: block-height
      }
    )

    (map-set total-debt
      { 
        token: token
      }
      {
        total: (+ (- (get total (get-total-debt token)) (get debt current-vault)) debt)
      }
    )

    (ok true)
  )
)
