;; @contract Migrate stake positions
;; @version 1.0

;; Get old stake positions
(define-read-only (get-old-stake-amounts (user principal))
  (let (
    (stake-amount-diko-usda (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 get-stake-amount-of user))
    (stake-amount-wstx-usda (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 get-stake-amount-of user))
    (stake-amount-xbtc-usda (contract-call? .arkadiko-stake-pool-xbtc-usda-v1-1 get-stake-amount-of user))
  )
    (ok {
      diko-usda: stake-amount-diko-usda,
      wstx-usda: stake-amount-wstx-usda,
      xbtc-usda: stake-amount-xbtc-usda,

    })
  )
)

;; Migrate DIKO pool staking
;; Burn and mint to ignore cooldown
(define-public (migrate-stdiko)
  (let (
    ;; Make sure to add rewards first
    (add-result (unwrap-panic (contract-call? .arkadiko-stake-pool-diko-v1-2 add-rewards-to-pool
      .arkadiko-stake-registry-v1-1
    )))

    ;; Get user balances
    (stdiko-balance (unwrap-panic (contract-call? .stdiko-token get-balance tx-sender)))
    (diko-balance (unwrap-panic (contract-call? .arkadiko-stake-pool-diko-v1-2 diko-for-stdiko
      .arkadiko-stake-registry-v1-1
      stdiko-balance
      (unwrap-panic (contract-call? .stdiko-token get-total-supply))
    )))
  )
    ;; Burn stDIKO from user
    (try! (contract-call? .arkadiko-dao burn-token .stdiko-token stdiko-balance tx-sender))

    ;; Burn DIKO in pool
    (try! (contract-call? .arkadiko-dao burn-token .arkadiko-token diko-balance .arkadiko-stake-pool-diko-v1-2))

    ;; Mint DIKO for user
    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-balance tx-sender))

    ;; Stake DIKO in new pool
    (contract-call? .arkadiko-stake-pool-diko-v2-1 stake
      .arkadiko-token
      diko-balance
      .arkadiko-vest-esdiko-v1-1
    )
  )
)

;; Migrate DIKO/USDA LP stake
(define-public (migrate-diko-usda)
  (let (
    (staked-amount (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 get-stake-amount-of tx-sender))
  )
    ;; Unstake from old pool
    (try! (contract-call? .arkadiko-stake-registry-v1-1 unstake
      .arkadiko-stake-registry-v1-1
      .arkadiko-stake-pool-diko-usda-v1-1
      .arkadiko-swap-token-diko-usda
      staked-amount
    ))

    ;; Stake in new pool
    (contract-call? .arkadiko-stake-pool-lp-v2-1 stake
      .arkadiko-swap-token-diko-usda
      staked-amount
    )
  )
)

;; Migrate STX/USDA LP stake
(define-public (migrate-wstx-usda)
  (let (
    (staked-amount (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 get-stake-amount-of tx-sender))
  )
    ;; Unstake from old pool
    (try! (contract-call? .arkadiko-stake-registry-v1-1 unstake
      .arkadiko-stake-registry-v1-1
      .arkadiko-stake-pool-wstx-usda-v1-1
      .arkadiko-swap-token-wstx-usda
      staked-amount
    ))

    ;; Stake in new pool
    (contract-call? .arkadiko-stake-pool-lp-v2-1 stake
      .arkadiko-swap-token-wstx-usda
      staked-amount
    )
  )
)

;; Migrate xBTC/USDA LP stake
(define-public (migrate-xbtc-usda)
  (let (
    (staked-amount (contract-call? .arkadiko-stake-pool-xbtc-usda-v1-1 get-stake-amount-of tx-sender))
  )
    ;; Unstake from old pool
    (try! (contract-call? .arkadiko-stake-registry-v1-1 unstake
      .arkadiko-stake-registry-v1-1
      .arkadiko-stake-pool-xbtc-usda-v1-1
      .arkadiko-swap-token-xbtc-usda
      staked-amount
    ))

    ;; Stake in new pool
    (contract-call? .arkadiko-stake-pool-lp-v2-1 stake
      .arkadiko-swap-token-xbtc-usda
      staked-amount
    )
  )
)
