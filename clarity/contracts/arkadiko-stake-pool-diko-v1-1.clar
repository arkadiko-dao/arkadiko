;; Stake Pool - Stake DIKO to get sDIKO
;; 
;; A fixed amount of rewards per block will be distributed across all stakers, according to their size in the pool
;; Rewards will be automatically staked before staking or unstaking. 
;; 
;; The cumm reward per stake represents the rewards over time, taking into account total staking volume over time
;; When total stake changes, the cumm reward per stake is increased accordingly.

(impl-trait .arkadiko-stake-pool-trait-v1.stake-pool-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait stake-registry-trait .arkadiko-stake-registry-trait-v1.stake-registry-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u18401))
(define-constant ERR-REWARDS-CALC (err u18001))
(define-constant ERR-WRONG-TOKEN (err u18002))
(define-constant ERR-COOLDOWN-NOT-ENDED (err u18003))
(define-constant ERR-WRONG-REGISTRY (err u18004))

;; Constants
(define-constant POOL-TOKEN .arkadiko-token)

;; Variables
(define-data-var last-reward-add-block uint u0)

;; ---------------------------------------------------------
;; Cooldown
;; ---------------------------------------------------------

;; Cooldown map
(define-map wallet-cooldown 
   { wallet: principal } 
   {
      redeem-period-start-block: uint,
      redeem-period-end-block: uint
   }
)

;; Get cooldown info for wallet
(define-read-only (get-cooldown-info-of (wallet principal))
  (default-to
    { redeem-period-start-block: u0, redeem-period-end-block: u0 }
    (map-get? wallet-cooldown { wallet: wallet })
  )
)

;; Start cooldown
(define-public (start-cooldown)
  (let (
    (redeem-period-start-block (+ block-height u1440)) ;; 1440 blocks = ~10 days
    (redeem-period-end-block (+ redeem-period-start-block u288)) ;; 288 blocks = ~2 days
  )
    (map-set wallet-cooldown { wallet: tx-sender } { 
      redeem-period-start-block: redeem-period-start-block,
      redeem-period-end-block: redeem-period-end-block 
    })
    (ok redeem-period-start-block)
  )
)


;; Check if cooldown ended
(define-read-only (wallet-can-redeem (wallet principal))
  (let (
    (wallet-cooldown-info (get-cooldown-info-of wallet))
    (redeem-period-start (get redeem-period-start-block wallet-cooldown-info))
    (redeem-period-end (get redeem-period-end-block wallet-cooldown-info))
  )
    (if (and (> block-height redeem-period-start) (< block-height redeem-period-end) (not (is-eq redeem-period-start u0)))
      true
      false
    )
  )
)


;; ---------------------------------------------------------
;; Stake Functions
;; ---------------------------------------------------------

;; Get variable last-reward-add-block
(define-read-only (get-last-reward-add-block)
  (var-get last-reward-add-block)
)

;; DIKO (staked & rewards) over total supply of stDIKO - Result with 6 decimals
(define-read-only (diko-stdiko-ratio)
  (let (
    ;; Total stDIKO supply
    (stdiko-supply (unwrap-panic (contract-call? .stdiko-token get-total-supply)))

    ;; Total DIKO (staked + rewards)
    (diko-supply (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender))))
  )
    (if (is-eq stdiko-supply u0)
      u1000000
      (/ (* diko-supply u1000000) stdiko-supply)
    )
  )
)

;; Amount of DIKO to receive for given stDIKO
(define-public (diko-for-stdiko (registry-trait <stake-registry-trait>) (amount uint) (stdiko-supply uint))
  (let (
    ;; DIKO already in pool
    (diko-supply (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender))))

    ;; DIKO still to be added to pool
    (rewards-to-add (calculate-pending-rewards-for-pool registry-trait))

    ;; Total DIKO
    (total-diko-supply (+ diko-supply rewards-to-add))

    ;; User stDIKO percentage
    (stdiko-percentage (/ (* amount u1000000) stdiko-supply))

    ;; Amount of DIKO the user will receive
    (diko-to-receive (/ (* stdiko-percentage total-diko-supply) u1000000))
  )
    (ok diko-to-receive)
  )
)

;; Get total amount of DIKO in pool for staker
(define-public (get-stake-of (registry-trait <stake-registry-trait>) (staker principal) (stdiko-supply uint))
  (let (
    ;; Sender stDIKO balance
    (stdiko-balance (unwrap-panic (contract-call? .stdiko-token get-balance tx-sender)))
  )
    (if (> stdiko-balance u0)
      ;; Amount of DIKO the user would receive when unstaking
      (ok (unwrap-panic (diko-for-stdiko registry-trait stdiko-balance stdiko-supply)))
      (ok u0)
    )
  )
)

;; Get total amount of DIKO in pool
(define-read-only (get-total-staked)
  (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender)))
)

;; Stake tokens (provide amount of DIKO)
(define-public (stake (registry-trait <stake-registry-trait>) (token <ft-trait>) (staker principal) (amount uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-registry"))) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq POOL-TOKEN (contract-of token)) ERR-WRONG-TOKEN)

    ;; Add pending rewards to pool
    (try! (add-rewards-to-pool registry-trait))

    (let (
      ;; DIKO/stDIKO 
      (diko-stdiko (diko-stdiko-ratio))

      ;; Calculate amount of stDIKO to receive
      (stdiko-to-receive (/ (* amount u1000000) diko-stdiko))
    )
      ;; Mint stDIKO
      (try! (contract-call? .arkadiko-dao mint-token .stdiko-token stdiko-to-receive staker))

      ;; Transfer DIKO to this contract
      (try! (contract-call? .arkadiko-token transfer amount staker (as-contract tx-sender) none))

      (ok stdiko-to-receive)
    )
  )
)

;; Unstake tokens (provide amount of stDIKO)
(define-public (unstake (registry-trait <stake-registry-trait>) (token <ft-trait>) (staker principal) (amount uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-registry"))) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq POOL-TOKEN (contract-of token)) ERR-WRONG-TOKEN)
    (asserts! (is-eq (wallet-can-redeem staker) true) ERR-COOLDOWN-NOT-ENDED)

    ;; Add pending rewards to pool
    (try! (add-rewards-to-pool registry-trait))

    (let (
      ;; Amount of DIKO the user will receive
      (diko-to-receive (unwrap-panic (diko-for-stdiko registry-trait amount (unwrap-panic (contract-call? .stdiko-token get-total-supply)))))
    )
      ;; Burn stDIKO 
      (try! (contract-call? .arkadiko-dao burn-token .stdiko-token amount staker))

      ;; Transfer DIKO back from this contract to the user
      (try! (as-contract (contract-call? .arkadiko-token transfer diko-to-receive (as-contract tx-sender) staker none)))

      (ok diko-to-receive)
    )
  )
)

;; Add DIKO rewards to pool
(define-public (add-rewards-to-pool (registry-trait <stake-registry-trait>))
  (let (
    (rewards-to-add (calculate-pending-rewards-for-pool registry-trait))
    (deactivated-block (unwrap-panic (contract-call? registry-trait get-pool-deactivated-block .arkadiko-stake-pool-diko-v1-1)))
  )
    ;; Rewards to add can be 0 if called multiple times in same block
    ;; Do not mint if pool deactivated
    (if (or (is-eq rewards-to-add u0) (not (is-eq deactivated-block u0)))
      false
      (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token rewards-to-add (as-contract tx-sender)))
    )

    ;; Update block number
    (var-set last-reward-add-block (get height (get-last-block-height registry-trait)))

    (ok rewards-to-add)
  )
)

;; Amount of rewards still to be added to the pool
;; This is an approximation as the rewards per block change every block
(define-private (calculate-pending-rewards-for-pool (registry-trait <stake-registry-trait>))
  (let (
    (rewards-per-block (unwrap-panic (contract-call? registry-trait get-rewards-per-block-for-pool .arkadiko-stake-pool-diko-v1-1)))
    (last-block-info (get-last-block-height registry-trait))
    (block-diff (- (get height last-block-info) (var-get last-reward-add-block)))
    (rewards-to-add (* rewards-per-block block-diff))
  )
    ;; Rewards to add can be 0 if called multiple times in same block
    ;; Do not mint if pool deactivated
    (if (or (is-eq rewards-to-add u0) (is-eq false (get pool-active last-block-info)))
      u0
      rewards-to-add
    )
  )
)

;; Return current block height, or block height when pool was deactivated
(define-private (get-last-block-height (registry-trait <stake-registry-trait>))
  (let (
    (deactivated-block (unwrap-panic (contract-call? registry-trait get-pool-deactivated-block .arkadiko-stake-pool-diko-v1-1)))
    (pool-active (is-eq deactivated-block u0))
  )
    (if (is-eq pool-active true)
      { height: block-height, pool-active: true }
      { height: deactivated-block, pool-active: false }
    )
  )
)

;; Execute slash with given percentage
(define-public (execute-slash (percentage uint))
  (let (
    (diko-supply (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender))))
    (slash-total (/ (* diko-supply percentage) u100))
    (dao-owner (contract-call? .arkadiko-dao get-dao-owner))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "diko-slash"))) ERR-NOT-AUTHORIZED)
    (try! (as-contract (contract-call? .arkadiko-token transfer slash-total (as-contract tx-sender) dao-owner none)))
    (ok slash-total)
  )
)

;; Needed because of pool trait
(define-public (claim-pending-rewards (registry-trait <stake-registry-trait>) (staker principal))
  (ok u0)
)

;; Needed because of pool trait
(define-public (get-pending-rewards (registry-trait <stake-registry-trait>) (staker principal))
  (ok u0)
)

;; Initialize the contract
(begin
  (var-set last-reward-add-block block-height)
)
