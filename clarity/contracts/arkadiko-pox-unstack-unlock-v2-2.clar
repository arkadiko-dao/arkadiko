(define-public (unstack (vault-id uint))
  (begin
    (try! (contract-call? .arkadiko-freddie-v1-1 toggle-stacking vault-id))
    (try! (contract-call? .arkadiko-stacker-payer-v3-6 initiate-unlock vault-id))
    (ok true)
  )
)
