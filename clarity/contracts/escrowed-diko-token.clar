;; TODO: update address
(impl-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

(define-fungible-token esdiko)

(define-constant ERR-NOT-AUTHORIZED u1401)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var req-staked-diko uint u250000) ;; 25% = 250000

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map whitelist principal bool)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (is-whitelisted (contract principal)) 
  (default-to
    false
    (map-get? whitelist contract)
  )
)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply esdiko))
)

(define-read-only (get-name)
  (ok "Escrowed Arkadiko Token")
)

(define-read-only (get-symbol)
  (ok "esDIKO")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance esdiko account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender .arkadiko-dao)
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    (asserts! (or (is-whitelisted sender) (is-whitelisted recipient)) (err ERR-NOT-AUTHORIZED))

    (match (ft-transfer? esdiko amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; ---------------------------------------------------------
;; DAO token trait
;; ---------------------------------------------------------

;; Mint method for DAO
(define-public (mint-for-dao (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-mint? esdiko amount recipient)
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-burn? esdiko amount sender)
  )
)

;; Burn external
(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    (ft-burn? esdiko amount sender)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-whitelist (contract principal) (enabled bool))
  (begin 
    (asserts! (is-eq tx-sender .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (map-set whitelist contract enabled)
    (ok enabled)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  (map-set whitelist .arkadiko-stake-pool-diko-v2-1 true)

  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? esdiko u10000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
  (try! (ft-mint? esdiko u10000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
  (try! (ft-mint? esdiko u10000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
  (try! (ft-mint? esdiko u10000000000 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
  (try! (ft-mint? esdiko u10000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF))
)
