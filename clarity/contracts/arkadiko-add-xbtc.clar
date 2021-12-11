(define-constant ERR-CANNOT-EXECUTE u301)

;; Phase 1
;; First xBTC liquidity pool is added to Arkadiko Swap: xBTC/STX 
;; New weights on emissions sinks:
;;  10% stDIKO
;;  15% STX/DIKO
;;  25% DIKO/USDA
;;  10% xBTC/STX
;;  40% STX/USDA
(define-public (add-xbtc-stx (x uint) (y uint))
  (let (
    (proposal (contract-call? .arkadiko-governance-v2-1 get-proposal-by-id u4))
  )
    (asserts! (> (get yes-votes proposal) (get no-votes proposal)) (err ERR-CANNOT-EXECUTE))

    (try!
      (contract-call?
        .arkadiko-swap-v2-1 create-pair
        .wrapped-stx-token
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tokensoft-token ;; TODO: xBTC mainnet addr
        .arkadiko-swap-token-wstx-xbtc
        "wSTX-xBTC"
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
        u400000
      )
    )
    (try!
      (contract-call?
        .arkadiko-stake-registry-v1-1 set-pool-data
        .arkadiko-stake-pool-wstx-xbtc-v1-1
        "STX-xBTC LP"
        u0
        u0
        u100000
      )
    )
    (ok true)
  )
)

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
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tokensoft-token ;; TODO: xBTC mainnet addr
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

;; Phase 3:
;; Enable xBTC as a collateral asset in Arkadiko Vaults. Conditional on 1m+ liquidity is reached in both xBTC pools on the swap. 
;; Initial parameters for the Vault would be:
;;  LTV: 25% (~400% collateralisation ratio)
;;  Yearly Stability Fee: 3%
;;  Liquidation Penalty: 10%
;;  Debt Ceiling: 100M
;;  Liquidation Ratio: 150%
(define-public (add-xbtc-collateral-type)
  (let (
    (proposal (contract-call? .arkadiko-governance-v2-1 get-proposal-by-id u4))
  )
    (asserts! (> (get yes-votes proposal) (get no-votes proposal)) (err ERR-CANNOT-EXECUTE))

    ;; TODO
    ;; (try! (contract-call? .arkadiko-collateral-types-v1-1 change-risk-parameters))
    (ok true)
  )
)
