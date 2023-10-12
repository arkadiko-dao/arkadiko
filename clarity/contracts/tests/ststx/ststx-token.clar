(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; Defines the Stacked STX according to the SIP010 Standard
(define-fungible-token ststx)

(define-constant ERR_NOT_AUTHORIZED u1401)

(define-data-var token-uri (string-utf8 256) u"")

;;-------------------------------------
;; SIP-010 
;;-------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply ststx))
)

(define-read-only (get-name)
  (ok "Stacked STX Token")
)

(define-read-only (get-symbol)
  (ok "stSTX")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance ststx account))
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR_NOT_AUTHORIZED))

    (match (ft-transfer? ststx amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; Initialize the contract
(begin
  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? ststx u10000000000000 'STE2RRS4JBKYN062FSVTEX4D19H86JGYHDD8ERQQ)) ;; 10 million USDA
  (try! (ft-mint? ststx u10000000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF)) ;; 10 million USDA
  (try! (ft-mint? ststx u10000000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)) ;; 10 million USDA
  (try! (ft-mint? ststx u10000000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)) ;; 10 million USDA
)
