;; Stake Registry - Keep track of all staking pools
;; 
;; Users can stake, unstake and claim rewards from active pools.
;; 
;; DAO can activate a new pool or deactivate an existing one.
;; When a pool is deactivated, users can not stake but they can unstake.

(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait stake-pool-trait .arkadiko-stake-pool-trait-v1.stake-pool-trait)
(use-trait stake-registry-trait .arkadiko-stake-registry-trait-v1.stake-registry-trait)
(impl-trait .arkadiko-stake-registry-trait-v1.stake-registry-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u19401))
(define-constant ERR-INVALID-POOL (err u19001))
(define-constant ERR-POOL-EXIST (err u19002))
(define-constant ERR-POOL-INACTIVE (err u19003))
(define-constant ERR-WRONG-REGISTRY (err u19004))

;; Variables
(define-data-var pool-count uint u0)

;; Pool maps
(define-map pools-data-map
  { pool: principal }
  {
    name: (string-ascii 256),
    deactivated-block: uint,
    deactivated-rewards-per-block: uint,
    rewards-percentage: uint
  }
)

;; Get pool info
(define-read-only (get-pool-data (pool principal))
  (unwrap-panic (map-get? pools-data-map { pool: pool }))
)

;; Get pool rewards per block
(define-read-only (get-rewards-per-block-for-pool (pool principal))
  (let (
    (total-staking-rewards (contract-call? .arkadiko-diko-guardian-v1-1 get-staking-rewards-per-block))
    (pool-percentage (get rewards-percentage (get-pool-data pool)))
    (deactivated-block (get deactivated-block (get-pool-data pool)))
    (deactivated-rewards-per-block (get deactivated-rewards-per-block (get-pool-data pool)))
  )
    (if (is-eq deactivated-block u0)
      (ok (/ (* total-staking-rewards pool-percentage) u1000000))
      (ok deactivated-rewards-per-block)
    )
  )
)

;; Get pool deactivated block
(define-read-only (get-pool-deactivated-block (pool principal))
  (let (
    (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
    (block (get deactivated-block pool-info))
  )
    (ok block)
  )
)

;; Stake tokens
(define-public (stake (registry-trait <stake-registry-trait>) (pool-trait <stake-pool-trait>) (token-trait <ft-trait>) (amount uint))
  (begin
    (let (
      (pool (contract-of pool-trait)) 
      (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
    )
      (asserts! (is-eq (as-contract tx-sender) (contract-of registry-trait)) ERR-WRONG-REGISTRY)
      (asserts! (is-eq (get deactivated-block pool-info) u0) ERR-POOL-INACTIVE)
      (contract-call? pool-trait stake registry-trait token-trait tx-sender amount)
    )
  )
)

;; Unstake tokens
(define-public (unstake (registry-trait <stake-registry-trait>) (pool-trait <stake-pool-trait>) (token-trait <ft-trait>) (amount uint))
  (begin
    (let (
      (pool (contract-of pool-trait)) 
      (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
    )
      (asserts! (is-eq (as-contract tx-sender) (contract-of registry-trait)) ERR-WRONG-REGISTRY)
      (contract-call? pool-trait unstake registry-trait token-trait tx-sender amount)
    )
  )
)

;; Get pending pool rewards
(define-public (get-pending-rewards (registry-trait <stake-registry-trait>) (pool-trait <stake-pool-trait>))
  (begin
    (let (
      (pool (contract-of pool-trait)) 
      (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
    )
      (asserts! (is-eq (as-contract tx-sender) (contract-of registry-trait)) ERR-WRONG-REGISTRY)
      (contract-call? pool-trait get-pending-rewards registry-trait tx-sender)
    )
  )
)

;; Claim pool rewards
(define-public (claim-pending-rewards (registry-trait <stake-registry-trait>) (pool-trait <stake-pool-trait>))
  (begin
    (asserts! (is-eq (as-contract tx-sender) (contract-of registry-trait)) ERR-WRONG-REGISTRY)
    (contract-call? pool-trait claim-pending-rewards registry-trait tx-sender)
  )
)

;; ---------------------------------------------------------
;; Contract initialisation
;; ---------------------------------------------------------

;; Initialize the contract
(begin

  ;; DIKO pool - Old
  (map-set pools-data-map
    { pool: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-v1-1 }
    {
      name: "DIKO",
      deactivated-block: u2000,
      deactivated-rewards-per-block: u0, ;; No need to set for this pool
      rewards-percentage: u100000 ;; 10% - Need to keep this so stakers on old pool can still claim rewards
    }
  )
  ;; DIKO pool - New
  (map-set pools-data-map
    { pool: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-tv1-1 }
    {
      name: "DIKO",
      deactivated-block: u0,
      deactivated-rewards-per-block: u0,
      rewards-percentage: u100000 ;; 10%
    }
  )


  ;; DIKO-USDA LP - Old
  (map-set pools-data-map
    { pool: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-v1-1 }
    {
      name: "DIKO-USDA LP",
      deactivated-block: u2000,
      deactivated-rewards-per-block: u187919718, ;; Should be equal to rewards per block at deactivated-block
      rewards-percentage: u300000 ;; 30% - Need to keep this so stakers on old pool can still claim rewards
    }
  )
  ;; DIKO-USDA LP - New
  (map-set pools-data-map
    { pool: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-diko-usda-tv1-1 }
    {
      name: "DIKO-USDA LP",
      deactivated-block: u0,
      deactivated-rewards-per-block: u0,
      rewards-percentage: u300000 ;; 30% 
    }
  )

  ;; wSTX-USDA LP
  (map-set pools-data-map
    { pool: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stake-pool-wstx-usda-v1-1 }
    {
      name: "wSTX-USDA LP",
      deactivated-block: u0,
      deactivated-rewards-per-block: u0,
      rewards-percentage: u600000 ;; 60% 
    }
  )
)

