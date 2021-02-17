;; Defines the Arkadiko Stablecoin according to the SRC20 Standard
(define-fungible-token arkadiko)

(define-constant mint-owner 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH)
(define-constant err-not-white-listed u51)

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
  (begin
    (print recipient)
    (print amount)
    (print tx-sender)
    (print contract-caller)
    (print mint-owner)
    (if
      (and
        (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.stx-reserve)
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
    (if
      (and
        (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.stx-reserve)
        (is-ok (ft-burn? arkadiko amount recipient))
      )
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
