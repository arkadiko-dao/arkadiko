(define-constant DAO-OWNER tx-sender)

(define-public (burn-usda)
  (begin
    (asserts! (is-eq contract-caller DAO-OWNER) (err u1))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token u6161487021776 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR)))
    (ok true)
  )
)
