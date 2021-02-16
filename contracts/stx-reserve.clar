(define-constant stx-reserve-address 'ST26FVX16539KKXZKJN098Q08HRX3XBAP541MFS0P)

(define-data-var stability-fee uint u1)
(define-data-var liquidation-ratio uint u150)
(define-data-var maximum-debt uint u100000000)
(define-data-var liquidation-penalty uint u13)
(define-constant err-collateral-failed u51)

;; Map of reserve entries
;; The entry consists of username and a public url
;;(define-map reserve ((reserve-id uint)) ((name (buff 30)) (balance uint)))
(define-map reserve { user: principal } { balance: uint })

;; stx-amount * current-stx-price == dollar-collateral-posted
;; 100 * (dollar-collateral-posted / liquidation-ratio) == stablecoins to mint 
(define-read-only (arkadiko-count (stx-amount uint))
  (let ((current-stx-price (contract-call? 'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle get-price)))
    (let ((amount (* u100 (/ (* stx-amount (get price current-stx-price)) (var-get liquidation-ratio)))))
      (begin
        (print amount)
        (print current-stx-price)
        (print (var-get liquidation-ratio))
        { amount: amount }
      )
    )
  )
)

(define-public (collateralize (stx-amount uint) (sender principal))
  (if (is-ok (stx-transfer? stx-amount sender stx-reserve-address))
    (begin
      (let ((coins (arkadiko-count stx-amount)))
        (if (is-ok (contract-call? 'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token mint sender (get amount coins)))
          (begin
            (map-insert reserve { user: sender } { balance: stx-amount })
            (ok stx-amount)
          )
          (err err-collateral-failed)
        )
      )
    )
    (err err-collateral-failed)
  )
)
