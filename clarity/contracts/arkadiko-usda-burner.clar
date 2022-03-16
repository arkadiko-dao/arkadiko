;; Burns USDA

(define-public (burn-usda (balance uint))
  (begin
    (try! (contract-call? .arkadiko-dao burn-token .usda-token balance tx-sender))

    (ok true)
  )
)
