(define-public (migrate-xstx)
  (let (
    (balance-v1 (unwrap-panic (contract-call? .xstx-token get-balance .arkadiko-sip10-reserve-v1-1)))
  )
    (try! (contract-call? .arkadiko-dao burn-token .xstx-token balance-v1 .arkadiko-sip10-reserve-v1-1))
    (try! (contract-call? .arkadiko-dao mint-token .xstx-token balance-v1 .arkadiko-sip10-reserve-v2-1))

    (ok true)
  )
)
