
(define-public (get-stake-amounts (user principal))
  (let (
    (stake-amount-diko-usda (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 get-stake-amount-of user))
    (stake-amount-wstx-usda (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 get-stake-amount-of user))
    (stake-amount-wstx-diko (contract-call? .arkadiko-stake-pool-wstx-diko-v1-1 get-stake-amount-of user))
  )
    (ok {
      stake-amount-diko-usda: stake-amount-diko-usda,
      stake-amount-wstx-usda: stake-amount-wstx-usda,
      stake-amount-wstx-diko: stake-amount-wstx-diko,

    })
  )
)

(define-public (get-stake-totals)
  (let (
    (stake-total-diko (contract-call? .arkadiko-stake-pool-diko-v2-1 get-total-staked))
    (stake-total-diko-usda (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 get-total-staked))
    (stake-total-wstx-usda (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 get-total-staked))
    (stake-total-wstx-diko (contract-call? .arkadiko-stake-pool-wstx-diko-v1-1 get-total-staked))
  )
    (ok {
      stake-total-diko: stake-total-diko,
      stake-total-diko-usda: stake-total-diko-usda,
      stake-total-wstx-usda: stake-total-wstx-usda,
      stake-total-wstx-diko: stake-total-wstx-diko,
    })
  )
)
