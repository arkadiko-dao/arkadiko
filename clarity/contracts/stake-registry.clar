;; Stake Registry - Keep track of all staking pools
;; 
;; Users can stake, unstake and claim rewards from active pools.
;; 
;; DAO can activate a new pool or deactivate an existing one.
;; When a pool is deactivated, users can not stake but they can unstake.

(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)
(use-trait stake-pool-trait .stake-pool-trait.stake-pool-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u19401))
(define-constant ERR-INVALID-POOL (err u19001))
(define-constant ERR-POOL-EXIST (err u19002))
(define-constant ERR-POOL-INACTIVE (err u19003))

;; Variables
(define-data-var pool-count uint u0)

;; Pool maps
(define-map pools-data-map
  { pool: principal }
  {
    name: (string-ascii 256),
    active: bool,
    activated-block: uint,
    deactivated-block: uint,
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
    (total-staking-rewards (contract-call? .diko-guardian get-staking-rewards-per-block))
    (pool-percentage (get rewards-percentage (get-pool-data pool)))
  )
    (/ (* total-staking-rewards pool-percentage) u1000000)
  )
)

;; Stake tokens
(define-public (stake (pool-trait <stake-pool-trait>) (token-trait <mock-ft-trait>) (amount uint))
  (begin
    (let (
      (pool (contract-of pool-trait)) 
      (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
    )
      (asserts! (is-eq (get active pool-info) true) ERR-POOL-INACTIVE)
      (try! (contract-call? pool-trait stake token-trait tx-sender amount))
      (ok amount)
    )
  )
)

;; Unstake tokens
(define-public (unstake (pool-trait <stake-pool-trait>) (token-trait <mock-ft-trait>) (amount uint))
  (begin
    (let (
      (pool (contract-of pool-trait)) 
      (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
    )
      (try! (contract-call? pool-trait unstake token-trait tx-sender amount))
      (ok amount)
    )
  )
)

;; Get pending pool rewards
;; A bug in traits blocks this from being read-only
;; see https://github.com/blockstack/stacks-blockchain/issues/1981
;; Workaround: get-pending-rewards on pool directly
;; (define-read-only (get-pending-rewards (pool-trait <stake-pool-trait>))
;;   (begin
;;     (let (
;;       (pool (contract-of pool-trait)) 
;;       (pool-info (unwrap! (map-get? pools-data-map { pool: pool }) ERR-POOL-EXIST))
;;     )
;;       (contract-call? pool-trait get-pending-rewards tx-sender)
;;       (ok u1)
;;     )
;;   )
;; )

;; Claim pool rewards
(define-public (claim-pending-rewards (pool-trait <stake-pool-trait>))
  (begin
    (contract-call? pool-trait claim-pending-rewards tx-sender)
  )
)

;; Mint rewards for staker - for active pools only
(define-public (mint-rewards-for-staker (amount uint) (staker principal))
  (begin
    (let (
      (pool-data (get-pool-data contract-caller))
    )
      ;; Only active pools can mint rewards
      (asserts! (is-eq (get active pool-data) true) ERR-POOL-INACTIVE)

      ;; Mint DIKO rewards for staker
      (try! (contract-call? .dao mint-token .arkadiko-token amount staker))
      
      (ok amount)
    )
  )
)

;; ---------------------------------------------------------
;; Contract initialisation
;; ---------------------------------------------------------

;; Initialize the contract
(begin
  ;; Add initial contracts
  (map-set pools-data-map
    { pool: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko }
    {
      name: "Diko",
      active: true,
      activated-block: block-height,
      deactivated-block: u0,
      rewards-percentage: u1000000 ;; 100% 
    }
  )

)

