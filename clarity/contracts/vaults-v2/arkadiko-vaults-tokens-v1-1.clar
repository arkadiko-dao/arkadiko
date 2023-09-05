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

(begin
  (map-set tokens
    { 
      token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.Wrapped-Bitcoin ;; TODO: update for mainnet
    }
    {
      name: "xBTC-A",
      token-name: "xBTC",
      max-debt: u1000000000000,       ;; 1M
      liquidation-ratio: u130,        ;; 130%
      liquidation-penalty: u1000,     ;; 10% in bps
      stability-fee: u400             ;; 4% in bps
    }
  )
)
