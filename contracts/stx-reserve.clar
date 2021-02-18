(define-constant stx-reserve-address 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE)
(define-data-var stability-fee uint u1)
(define-data-var liquidation-ratio uint u150)
(define-data-var collateral-to-debt-ratio uint u200)
(define-data-var maximum-debt uint u100000000)
(define-data-var liquidation-penalty uint u13)
(define-constant err-transfer-failed u49)
(define-constant err-minter-failed u50)
(define-constant token-minter (as-contract tx-sender))

;; Map of reserve entries
;; The entry consists of a user principal with their STX balance collateralized
(define-map vaults { user: principal } { stx-collateral: uint, coins-minted: uint })

(define-read-only (get-vault (user principal))
  (unwrap-panic (map-get? vaults { user: user }))
)


;; stx-amount * current-stx-price-in-cents == dollar-collateral-posted
;; (dollar-collateral-posted / liquidation-ratio) == stablecoins to mint
(define-read-only (calculate-arkadiko-count (stx-amount uint))
  (let ((current-stx-price (contract-call? .oracle get-price)))
    (let ((amount (/ (* stx-amount (get price current-stx-price)) (var-get collateral-to-debt-ratio))))
      (begin
        (print amount)
        (print current-stx-price)
        (print (var-get liquidation-ratio))
        (print (var-get collateral-to-debt-ratio))
        { amount: amount }
      )
    )
  )
)

(define-read-only (calculate-current-collateral-to-debt-ratio (user principal))
  (let ((current-stx-price (contract-call? .oracle get-price)))
    (let ((current-vault (get-vault user)))
      (begin
        {
          amount: (/
            (* (get stx-collateral (unwrap-panic (map-get? vaults { user: user }))) (get price current-stx-price))
            (get coins-minted (unwrap-panic (map-get? vaults { user: user })))
          )
        }
      )
    )
  )
)

;; accept collateral in STX tokens
;; save STX in stx-reserve-address
;; calculate price and collateralisation ratio
(define-public (collateralize-and-mint (stx-amount uint) (sender principal))
  (let ((coins (calculate-arkadiko-count stx-amount)))
    (match (print (stx-transfer? stx-amount sender stx-reserve-address))
      success (match (print (as-contract (contract-call? .arkadiko-token mint sender (get amount coins))))
        transferred (begin
          (print "minted tokens! inserting into map now.")
          (map-set vaults { user: sender } { stx-collateral: stx-amount, coins-minted: (get amount coins) })
          (ok (get amount coins))
        )
        error (err err-transfer-failed)
      )
      error (err err-minter-failed)
    )
  )
)

;; return stablecoin to free up STX tokens
;; method assumes position has not been liquidated
;; and thus collateral to debt ratio > liquidation ratio
(define-public (burn (stablecoin-amount uint) (sender principal))
  (begin
    (print "burn tokens and release collateral")
    (ok 1)
  )
)

(define-public (liquidate (sender principal))
  (begin
    (print "burn tokens and auction collateral")
    (ok 1)
  )
)
