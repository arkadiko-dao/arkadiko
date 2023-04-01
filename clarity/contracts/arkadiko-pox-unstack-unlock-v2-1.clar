(define-public (unstack (vault-id uint))
  (begin
    (try! (contract-call? .arkadiko-freddie-v1-1 toggle-stacking vault-id))
    (try! (contract-call? .arkadiko-stacker-payer-v3-5 initiate-unlock vault-id))
    (ok true)
  )
)

(define-public (unstack-and-unlock (vault-id uint))
  (let ((vault (contract-call? .arkadiko-freddie-v1-1 get-vault-by-id vault-id)))
    (if (get revoked-stacking vault)
      true ;; already revoked
      (try! (contract-call? .arkadiko-freddie-v1-1 toggle-stacking vault-id))
    )
    (try! (contract-call? .arkadiko-stacker-payer-v3-5 enable-vault-withdrawals vault-id))
    (ok true)
  )
)
