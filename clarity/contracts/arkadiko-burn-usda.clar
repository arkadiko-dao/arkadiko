(define-public (burn-mf)
  (begin
    (print "YE YE")
    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token u746013368502 'SP20X0Y48B6T8YCS770YH8X4Y2Q2ZC09CT8XN1VBD)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token u746013368502 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR)))
    (ok true)
  )
)
