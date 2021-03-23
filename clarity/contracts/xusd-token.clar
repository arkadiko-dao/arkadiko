;; Defines the xUSD Stablecoin according to the SRC20 Standard
(define-fungible-token xusd)

(define-constant err-burn-failed u1)

(define-read-only (total-supply)
  (ok (ft-get-supply xusd))
)

(define-read-only (name)
  (ok "xUSD")
)

(define-read-only (symbol)
  (ok "xUSD")
)

(define-read-only (decimals)
  (ok u6)
)

(define-read-only (balance-of (account principal))
  (ok (ft-get-balance xusd account))
)

(define-public (transfer (recipient principal) (amount uint))
  (begin
    (print "xusd.transfer")
    (print amount)
    (print tx-sender)
    (print recipient)
    (ft-transfer? xusd amount tx-sender recipient)
  )
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (if
      (and
        (is-eq contract-caller 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP.freddie)
        (is-ok (ft-mint? xusd amount recipient))
      )
      (ok amount)
      (err false)
    )
  )
)

(define-public (burn (amount uint) (sender principal))
  (if (is-eq contract-caller 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP.freddie)
    (ok (unwrap! (ft-burn? xusd amount sender) (err err-burn-failed)))
    (err err-burn-failed)
  )
)

;; Initialize the contract
(begin
  (try! (ft-mint? xusd u20 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7)) ;; alice
  (try! (ft-mint? xusd u10 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE)) ;; bob
  (try! (ft-mint? xusd u10000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF)) ;; mocknet addr
)
