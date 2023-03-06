;; xUSD/USDA LP Helper Token
;; The ALEX LP token is not a fungible token, while the LP stake pool does require a fungible token to stake.
;; This helper token is a fungible token representation of the semi fungible ALEX LP token for the xUSD/USDA pool.

(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ALEX pool ID
(define-constant TOKEN-ID u4)

;; ---------------------------------------------------------
;; SIP 010
;; ---------------------------------------------------------

(define-fungible-token xusd-usda)

;; Encapsulates a semi fungible token transfer
;; This method is used when staking/unstaking and makes sure the semi fungible LP token is transferred from/to the staker.
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (contract-call? 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-amm-swap-pool transfer TOKEN-ID (* amount u100) sender recipient)
)

(define-read-only (get-name)
  (ok "Arkadiko xUSD USDA Helper Token")
)

(define-read-only (get-symbol)
  (ok "ARKV1XUSDUSDAHELPER")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance xusd-usda owner))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply xusd-usda))
)

(define-read-only (get-token-uri)
  (ok (some u"https://arkadiko.finance/tokens/xusd-usda-token.json"))
)

;; ---------------------------------------------------------
;; Helper
;; ---------------------------------------------------------

;; one stop function to gather all the data relevant to the LP token in one call
(define-read-only (get-data (owner principal))
  (ok {
    name: (unwrap-panic (get-name)),
    symbol: (unwrap-panic (get-symbol)),
    decimals: (unwrap-panic (get-decimals)),
    uri: (unwrap-panic (get-token-uri)),
    supply: (unwrap-panic (get-total-supply)),
    balance: (unwrap-panic (get-balance owner))
  })
)
