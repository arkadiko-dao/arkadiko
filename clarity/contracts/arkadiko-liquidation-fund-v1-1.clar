;; @contract fund to perform liquidations
;; @version 1.1

(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED u25001)

;; Variables
(define-data-var fund-controller principal tx-sender)


;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; Transfer controller
(define-public (set-fund-controller (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))
    (ok (var-set fund-controller address))
  )
)


;; ---------------------------------------------------------
;; Deposit and withdraw
;; ---------------------------------------------------------

(define-public (deposit-stx (amount uint))
  (begin
    ;; Transfer funds to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    (ok amount)
  )
)

(define-public (withdraw (wallet principal) (stx-amount uint) (diko-amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))

    ;; Transfer STX
    (if (is-eq stx-amount u0)
      true
      (try! (as-contract (stx-transfer? stx-amount tx-sender wallet)))
    )

    ;; Transfer DIKO
    (if (is-eq diko-amount u0)
      true
      (try! (as-contract (contract-call? .arkadiko-token transfer diko-amount tx-sender wallet none)))
    )

    (ok stx-amount)
  )
)


;; ---------------------------------------------------------
;; Manage LP staking - Helpers
;; ---------------------------------------------------------

;; Helper to get STX in contract
(define-read-only (get-contract-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; Unstake > remove LP > swap all to STX
(define-public (do-stake-to-stx)
  (begin
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (try! (unstake-lp))
    (try! (remove-lp u100))
    (let (
      (contract-usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    )
      (try! (swap-usda-to-stx contract-usda-balance u0))
    )
    (ok true)
  )
)

;; Swap half to USDA > add LP > stake LP
(define-public (do-stx-to-stake (stx-amount uint))
  (begin
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (try! (swap-stx-to-usda (/ stx-amount u2) u0))
    (try! (add-usda-to-lp))
    (try! (stake-lp))
    (ok true)
  )
)

;; Add LP position
;; Based on amount of USDA in contract
(define-public (add-usda-to-lp)
  (let (
    (contract-usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    (swap-balances (unwrap-panic (contract-call? .arkadiko-swap-v2-1 get-balances .wrapped-stx-token .usda-token)))
    (balance-x (unwrap-panic (element-at swap-balances u0)))
    (balance-y (unwrap-panic (element-at swap-balances u1)))
    (stx-to-add-exact (/ (* contract-usda-balance balance-x) balance-y))
    
    ;; 5% slippage
    (slippage u50000)
    (stx-to-add (- stx-to-add-exact (/ (* stx-to-add-exact slippage) u1000000)))
  )
    (add-lp stx-to-add)
  )
)


;; ---------------------------------------------------------
;; Manage LP staking - Core
;; ---------------------------------------------------------

;; Swap STX to USDA
(define-public (swap-stx-to-usda (stx-amount uint) (min-usda-out uint))
  (begin
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (if (is-eq stx-amount u0)
      (ok (list u0 u0))
      (as-contract (contract-call? .arkadiko-swap-v2-1 swap-x-for-y .wrapped-stx-token .usda-token stx-amount min-usda-out))
    )
  )
)

;; Swap USDA to STX
(define-public (swap-usda-to-stx (usda-amount uint) (min-stx-out uint))
  (begin
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (if (is-eq usda-amount u0)
      (ok (list u0 u0))
      (as-contract (contract-call? .arkadiko-swap-v2-1 swap-y-for-x .wrapped-stx-token .usda-token usda-amount min-stx-out))
    )
  )
)

;; Add LP position
(define-public (add-lp (stx-amount uint))
  (begin
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (if (is-eq stx-amount u0)
      (ok true)
      (as-contract (contract-call? .arkadiko-swap-v2-1 add-to-position
        .wrapped-stx-token
        .usda-token
        .arkadiko-swap-token-wstx-usda
        stx-amount
        u0
      ))
    )
  )
)

;; Remove LP position
(define-public (remove-lp (percentage uint))
  (let (
    (contract-lp-balance (unwrap-panic (contract-call? .arkadiko-swap-token-wstx-usda get-balance (as-contract tx-sender))))
  )
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (if (is-eq contract-lp-balance u0)
      (ok (list u0 u0))
      (as-contract (contract-call? .arkadiko-swap-v2-1 reduce-position
        .wrapped-stx-token
        .usda-token
        .arkadiko-swap-token-wstx-usda
        percentage
      ))
    )
  )
)

;; Stake all LP tokens
(define-public (stake-lp)
  (let (
    (contract-lp-balance (unwrap-panic (contract-call? .arkadiko-swap-token-wstx-usda get-balance (as-contract tx-sender))))
  )
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (if (is-eq contract-lp-balance u0)
      (ok u0)
      (as-contract (contract-call? .arkadiko-stake-registry-v1-1 stake
        .arkadiko-stake-registry-v1-1 
        .arkadiko-stake-pool-wstx-usda-v1-1 
        .arkadiko-swap-token-wstx-usda 
        contract-lp-balance
      ))
    )
  )
)

;; Unstake all LP tokens
(define-public (unstake-lp)
  (let (
    (stake-balance (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 get-stake-amount-of (as-contract tx-sender)))
  )
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (if (is-eq stake-balance u0)
      (ok u0)
      (as-contract (contract-call? .arkadiko-stake-registry-v1-1 unstake 
        .arkadiko-stake-registry-v1-1 
        .arkadiko-stake-pool-wstx-usda-v1-1 
        .arkadiko-swap-token-wstx-usda 
        stake-balance
      ))
    )
  )
)

;; Claim stake rewards
(define-public (claim-rewards)
  (begin
    (asserts! 
      (or
        (is-eq tx-sender (var-get fund-controller))
        (is-eq tx-sender (as-contract tx-sender))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (as-contract (contract-call? .arkadiko-stake-registry-v1-1 claim-pending-rewards
        .arkadiko-stake-registry-v1-1
        .arkadiko-stake-pool-wstx-usda-v1-1
      ))
  )
)


;; ---------------------------------------------------------
;; Auction
;; ---------------------------------------------------------

;; Auction engine: bid
(define-public (bid
  (vault-manager <vault-manager-trait>)
  (oracle <oracle-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
  (lot-index uint)
  (usda uint)
)
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))

    (as-contract (contract-call? .arkadiko-auction-engine-v2-1 bid
      vault-manager
      oracle
      coll-type
      auction-id
      lot-index
      usda
    ))
  )
)

;; Auction engine: redeem-lot-collateral
(define-public (redeem-lot-collateral
  (vault-manager <vault-manager-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
  (lot-index uint)
)
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))

    (as-contract (contract-call? .arkadiko-auction-engine-v2-1 redeem-lot-collateral
      vault-manager
      ft
      reserve
      coll-type
      auction-id
      lot-index
    ))
  )
)

;; Freddie: redeem-stx
(define-public (redeem-stx (ustx-amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))

    (as-contract (contract-call? .arkadiko-freddie-v1-1 redeem-stx ustx-amount))
  )
)
