(define-constant ERR-CANNOT-EXECUTE u301)

;; Phase 2:
;; Second xBTC liquidity pool is added once xBTC/STX has sufficient liquidity (1m+): xBTC/USDA
;; New weights on emissions sinks:
;;  10% stDIKO
;;  15% STX/DIKO
;;  25% DIKO/USDA
;;  5% xBTC/STX
;;  10% xBTC/USDA
;;  35% STX/USDA
(define-public (add-xbtc-usda (x uint) (y uint))
  (let (
    (proposal (contract-call? .arkadiko-governance-v2-1 get-proposal-by-id u4))
  )
    (asserts! (> (get yes-votes proposal) (get no-votes proposal)) (err ERR-CANNOT-EXECUTE))

    (try!
      (contract-call?
        .arkadiko-swap-v2-1 create-pair
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tokensoft-token ;; TODO: xBTC mainnet addr SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin
        .usda-token
        .arkadiko-swap-token-xbtc-usda
        "xBTC-USDA"
        x
        y
      )
    )
    (try!
      (contract-call?
        .arkadiko-stake-registry-v1-1 set-pool-data
        .arkadiko-stake-pool-wstx-usda-v1-1
        "STX-USDA LP"
        u0
        u0
        u350000
      )
    )
    (try!
      (contract-call?
        .arkadiko-stake-registry-v1-1 set-pool-data
        .arkadiko-stake-pool-wstx-xbtc-v1-1
        "STX-xBTC LP"
        u0
        u0
        u50000
      )
    )
    (try!
      (contract-call?
        .arkadiko-stake-registry-v1-1 set-pool-data
        .arkadiko-stake-pool-xbtc-usda-v1-1
        "xBTC-USDA LP"
        u0
        u0
        u100000
      )
    )
    (ok true)
  )
)
