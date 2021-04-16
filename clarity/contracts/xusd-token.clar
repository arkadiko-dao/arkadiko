(impl-trait .mock-ft-trait.mock-ft-trait)

;; Defines the xUSD Stablecoin according to the SRC20 Standard
(define-fungible-token xusd)

(define-constant ERR-BURN-FAILED u114)

(define-read-only (get-total-supply)
  (ok (ft-get-supply xusd))
)

(define-read-only (get-name)
  (ok "xUSD")
)

(define-read-only (get-symbol)
  (ok "xUSD")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance-of (account principal))
  (ok (ft-get-balance xusd account))
)

;; TODO - finalize before mainnet deployment
(define-read-only (get-token-uri)
  (ok none)
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (ft-transfer? xusd amount sender recipient)
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (if
      (and
        (or
          (is-eq contract-caller .freddie)
          (is-eq contract-caller .stx-reserve)
          (is-eq contract-caller .sip10-reserve)
        )
        (is-ok (ft-mint? xusd amount recipient))
      )
      (ok amount)
      (err false)
    )
  )
)

(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! 
      (or (is-eq contract-caller .freddie) (is-eq contract-caller .auction-engine))
      (err ERR-BURN-FAILED))
    (ft-burn? xusd amount sender)))

;; Initialize the contract
(begin
  ;; Testnet only: seed wallet_2 and wallet_3
  ;; (asserts! is-in-regtest (ok u0))
  (try! (ft-mint? xusd u20 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  (try! (ft-mint? xusd u10 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8)))
