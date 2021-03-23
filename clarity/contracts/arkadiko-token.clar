;; Defines the Arkadiko Governance Token according to the SRC20 Standard
(define-fungible-token diko)

;; errors
(define-constant err-unauthorized u1)

(define-read-only (total-supply)
  (ok (ft-get-supply diko))
)

(define-read-only (name)
  (ok "Arkadiko")
)

(define-read-only (symbol)
  (ok "DIKO")
)

(define-read-only (decimals)
  (ok u6)
)

(define-read-only (balance-of (account principal))
  (ok (ft-get-balance diko account))
)

(define-public (transfer (recipient principal) (amount uint))
  (begin
    (print "diko.transfer")
    (print amount)
    (print tx-sender)
    (print recipient)
    (ft-transfer? diko amount tx-sender recipient)
  )
)

(define-public (mint (amount uint) (recipient principal))
  (err err-unauthorized)
)

(define-public (burn (amount uint) (sender principal))
  (ok (ft-burn? diko amount sender))
)

;; Initialize the contract
(begin
  ;; mint 1 million tokens
  (try! (ft-mint? diko u990000000000 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE))
  (try! (ft-mint? diko u10000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF))
)
