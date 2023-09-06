;; Vaults Collateral Tokens 
;;

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u970401)
(define-constant ERR_UNKNOWN_TOKEN u970001)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var token-list (list 25 principal) (list))

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

(define-read-only (get-token-list)
  (var-get token-list)
)


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

    (if (is-some (index-of? (var-get token-list) token))
      ;; Token already in list
      false
      ;; Add token to list
      (begin
        (as-max-len? (append (var-get token-list) token) u25)
        true
      )
    )

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

(define-public (remove-token (token principal))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))
    (asserts! (is-some (index-of? (var-get token-list) token)) (err ERR_UNKNOWN_TOKEN))

    (map-delete tokens { token: token })
    ;; TODO: remove token from list
    ;; (filter is-eq (var-get token-list))
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
