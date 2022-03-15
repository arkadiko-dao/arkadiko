;; Method to update collateral types
(begin
  (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters "XBTC-A" (list (tuple (key "collateral-to-debt-ratio") (new-value u200)))))
  (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters "STX-A" (list (tuple (key "collateral-to-debt-ratio") (new-value u200)))))
  (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters "STX-B" (list (tuple (key "collateral-to-debt-ratio") (new-value u200)))))
)
