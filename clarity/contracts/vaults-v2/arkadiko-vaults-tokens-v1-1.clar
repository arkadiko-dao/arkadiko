;; Vaults Collateral Tokens 
;;

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map tokens
  { 
    token: principal
  }
  {
    name: (string-ascii 256),
    token-name: (string-ascii 12),
    max-debt: uint,
    liquidation-ratio: uint,
    liquidation-penalty: uint,
    stability-fee: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-token (token principal))
  (map-get? tokens { token: token })
)

;; ---------------------------------------------------------
;; Set
;; ---------------------------------------------------------

;; TODO: admin/governance should be able to add/update collateral token

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

;; TODO: add collateral tokens on init
