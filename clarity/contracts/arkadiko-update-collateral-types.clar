;; Method to update collateral types
(define-public (update-ltv)
  (let (
    (changes (list (tuple (key "collateral-to-debt-ratio") (new-value u250))))
  )
    (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters "XBTC-A" changes))
    (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters "STX-A" changes))
    (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters "STX-B" changes))
    (ok true)
  )
)
