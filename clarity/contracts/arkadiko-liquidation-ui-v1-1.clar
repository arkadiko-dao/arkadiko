;; Liquidation pool helpers for UI

;; Combine pending user rewards + reward data
(define-public (get-user-reward-info (reward-id uint))
  (let (
    (sender-rewards (unwrap-panic (contract-call? .arkadiko-liquidation-rewards-v1-1 get-rewards-of tx-sender reward-id .arkadiko-liquidation-pool-v1-1)))
    (rewards-data (contract-call? .arkadiko-liquidation-rewards-v1-1 get-reward-data reward-id))
  )
    (ok {
      reward-id: reward-id,
      pending-rewards: sender-rewards,
      token: (get token rewards-data),
      token-is-stx: (get token-is-stx rewards-data)
    })
  )
)

