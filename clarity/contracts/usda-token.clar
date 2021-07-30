;;;;;;;;;;;;;;;;;;;;; SIP 010 ;;;;;;;;;;;;;;;;;;;;;;
;; testnet: (impl-trait 'STR8P3RD1EHA8AA37ERSSSZSWKS9T2GYQFGXNA4C.sip-010-trait-ft-standard.sip-010-trait)
;; (impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

;; Defines the USDA Stablecoin according to the SIP-010 Standard
(define-fungible-token usda)

(define-data-var token-uri (string-utf8 256) u"")

;; errors
(define-constant ERR-NOT-AUTHORIZED u14401)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply usda))
)

(define-read-only (get-name)
  (ok "USDA")
)

(define-read-only (get-symbol)
  (ok "USDA")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usda account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
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

    (match (ft-transfer? usda amount sender recipient)
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
    (ft-mint? usda amount recipient)
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-burn? usda amount sender)
  )
)


;; Initialize the contract
(begin
  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? usda u10 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC))
  (try! (ft-mint? usda u1000000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)) ;; 1 million USDA
  (try! (ft-mint? usda u1000000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF)) ;; 1 million USDA
  (try! (ft-mint? usda u1000000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)) ;; 1 million USDA
  (try! (ft-mint? usda u1000000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)) ;; 1 million USDA
)
