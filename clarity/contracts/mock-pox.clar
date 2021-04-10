(define-public (stack-stx (amount-ustx uint)
                          (pox-addr (tuple (version (buff 1)) (hashbytes (buff 20))))
                          (start-burn-ht uint)
                          (lock-period uint))
  (if true
    (ok { stacker: tx-sender, lock-amount: amount-ustx, unlock-burn-height: u680000 })
    (err 1)
  )
)

(define-read-only (can-stack-stx (pox-addr (tuple (version (buff 1)) (hashbytes (buff 20))))
                                  (amount-ustx uint)
                                  (first-reward-cycle uint)
                                  (num-cycles uint))
  (ok true)
)

(define-public (delegate-stx (amount-ustx uint) (delegate-to principal) (until-burn-ht (optional uint))
              (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1))))))
  (if true
    (ok true)
    (err 1)
  )
)

(define-public (stack-aggregation-commit (pox-address (tuple (hashbytes (buff 20)) (version (buff 1)))) (reward-cycle uint))
  (if true
    (ok true)
    (err 1)
  )
)

(define-public (revoke-delegate-stx)
  (ok true)
)

(define-public (delegate-stx-ext (amount-ustx uint) (delegate-to principal) (until-burn-ht (optional uint))
              (pool-pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))
              (user-pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))
              (locking-period uint))
  (if true
    (ok true)
    (err 1)
  )
)
