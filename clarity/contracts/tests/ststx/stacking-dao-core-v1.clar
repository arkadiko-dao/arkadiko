
(define-public (deposit (reserve-contract principal) (stx-amount uint) (referrer (optional principal)))
  (let (
    (stx-ststx u1000500)
    (ststx-to-receive (/ (* stx-amount u1000000) stx-ststx))
  )
    (try! (stx-transfer? stx-amount tx-sender reserve-contract))
    (try! (contract-call? .ststx-token mint-for-protocol ststx-to-receive tx-sender))

    (ok ststx-to-receive)
  )
)
