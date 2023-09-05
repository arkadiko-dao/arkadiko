;; Vaults Collateral Tokens 
;;

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u970401)

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
;; Admin
;; ---------------------------------------------------------

(define-public (set-token 
  (token principal) 
  (name (string-ascii 256)) 
  (token-name (string-ascii 12)) 
  (max-debt uint)
  (liquidation-ratio uint)
  (liquidation-penalty uint)
  (stability-fee uint)
)
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (map-set tokens
      { 
        token: token
      }
      {
        name: name,
        token-name: token-name,
        max-debt: max-debt,
        liquidation-ratio: liquidation-ratio, 
        liquidation-penalty: liquidation-penalty,
        stability-fee: stability-fee
      }
    )

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

;; TODO: add all collateral tokens on init
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
