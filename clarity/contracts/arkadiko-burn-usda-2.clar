(define-public (burn-mf)
  (begin
    (print "YE YE")
    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token u14834591585 'SPP4ETJ72VES0W9D6A3VB6TXC00X2E2FFPH8NSFS)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token u14834591585 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR)))
    (ok true)
  )
)
