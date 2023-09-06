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
(define-data-var token-to-remove principal tx-sender)

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

;; Add or update token
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

    (map-set tokens { token: token }
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

;; Remove token
(define-public (remove-token (token principal))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))
    (asserts! (is-some (index-of? (var-get token-list) token)) (err ERR_UNKNOWN_TOKEN))

    (var-set token-to-remove token)

    (map-delete tokens { token: token })
    (var-set token-list (filter is-token-to-remove (var-get token-list)))
    (ok true)
  )
)

(define-read-only (is-token-to-remove (token principal))
  (is-eq token (var-get token-to-remove))
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

;; TODO: add all collateral tokens on init
(begin
  (var-set token-list (list 
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wstx-token
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ststx-token 
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.Wrapped-Bitcoin
  ))

  (map-set tokens
    { 
      ;; TODO: update for mainnet
      token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wstx-token 
    }
    {
      name: "STX-A",
      token-name: "STX",
      max-debt: u1000000000000,       ;; 1M
      liquidation-ratio: u13000,      ;; 130% in bps
      liquidation-penalty: u1000,     ;; 10% in bps
      stability-fee: u400             ;; 4% in bps
    }
  )

  (map-set tokens
    { 
      ;; TODO: update for mainnet
      token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ststx-token 
    }
    {
      name: "stSTX-A",
      token-name: "stSTX",
      max-debt: u1000000000000,       ;; 1M
      liquidation-ratio: u13000,      ;; 130% in bps
      liquidation-penalty: u1000,     ;; 10% in bps
      stability-fee: u400             ;; 4% in bps
    }
  )

  (map-set tokens
    { 
      ;; TODO: update for mainnet
      token: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.Wrapped-Bitcoin 
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
