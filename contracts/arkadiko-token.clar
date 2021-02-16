;; Defines the Arkadiko Stablecoin according to the SRC20 Standard
(define-fungible-token arkadiko)

(define-read-only (total-supply)
  (ok (ft-get-supply arkadiko))
)

(define-read-only (name)
  (ok "Arkadiko")
)

(define-read-only (symbol)
  (ok "DIKO")
)

(define-read-only (decimals)
  (ok u8)
)

(define-public (balance-of (account principal))
  (ok (ft-get-balance arkadiko account))
)

(define-public (transfer (recipient principal) (amount uint))
  (begin
    (print "arkadiko.transfer")
    (print amount)
    (print tx-sender)
    (print recipient)
    (print (ft-transfer? arkadiko amount tx-sender recipient))
  )
)

(define-public (mint (recipient principal) (amount uint))
  ;; accept collateral in STX tokens
  ;; save STX in stx-reserve-address
  ;; calculate price and collateralisation ratio
  (begin
    (print recipient)
    (print amount)
    (if
      (and
        (is-ok (contract-call? 'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve collateralize amount tx-sender))
        (is-ok (ft-mint? arkadiko amount recipient))
      )
      (ok amount)
      (err false)
    )
  )
)

(define-public (burn (recipient principal) (amount uint))
  ;; burn the arkadiko stablecoin and return STX
  (begin
    (print recipient)
    (print amount)
    (if (is-ok (ft-burn? arkadiko amount recipient))
      (ok amount)
      (err false)
    )
  )
)

;; Initialize the contract
(begin
  (try! (ft-mint? arkadiko u20 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7)) ;; alice
  (try! (ft-mint? arkadiko u10 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE)) ;; bob
)
