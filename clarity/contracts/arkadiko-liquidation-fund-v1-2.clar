;; @contract fund to perform liquidations
;; @version 1.1

;; Errors
(define-constant ERR-NOT-AUTHORIZED u25001)
(define-constant ERR-INSUFFICIENT-SHARES u25002)

;; Variables
(define-data-var fund-controller principal tx-sender)
(define-data-var total-shares uint u0)
(define-data-var max-stx-to-stake uint u0)

(define-data-var cumm-reward-per-share uint u0)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; TODO: emergency shutdown
;; TODO: send funds back to depositer 

;; Transfer controller
(define-public (set-fund-controller (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))
    (ok (var-set fund-controller address))
  )
)

;; Set max amount of STX that can be used to stake
(define-public (set-max-stx-to-stake (max-stx uint))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))
    (var-set max-stx-to-stake max-stx)
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Wallets and shares
;; ---------------------------------------------------------

(define-map wallet-shares 
   { wallet: principal } 
   {
      shares: uint
   }
)

(define-read-only (get-shares-for-wallet (wallet principal))
  (default-to 
    u0
    (get shares (map-get? wallet-shares { wallet: wallet }) )
  )
)

(define-read-only (get-total-shares)
  (var-get total-shares)
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
  (let (
    (sender tx-sender)
  )
    (asserts! (is-eq tx-sender (var-get fund-controller)) (err ERR-NOT-AUTHORIZED))

    ;; Transfer STX
    (try! (as-contract (stx-transfer? stx-amount tx-sender sender)))

    ;; Transfer DIKO
    (try! (as-contract (contract-call? .arkadiko-token transfer diko-amount tx-sender sender none)))

    (ok stx-amount)
  )
)

;; Helper for deposit-stx
(define-public (new-shares-for-stx (amount uint))
  (let (
    ;; Current contract balance
    (contract-stx-balance (stx-get-balance (as-contract tx-sender)))
  )
    (if (is-eq (var-get total-shares) u0)
      (ok u10000000)
      (let (
        (shares-per-stx (/ (* (var-get total-shares) u100000000) contract-stx-balance))
      )
        (ok (/ (* amount shares-per-stx) u100000000))
      )
    )
  )
)

(define-public (deposit-stx (amount uint))
  (let (
    ;; Unstake and convert all to STX
    ;; Important to do first, as next calculations depend on available STX in this contract
    (all-to-stx (unwrap-panic (as-contract (do-stake-to-stx))))

    ;; Shares to receive
    (new-shares (unwrap-panic (new-shares-for-stx amount)))

    ;; Current shares
    (current-wallet-shares (get-shares-for-wallet tx-sender))
  )
    ;; Update total shares
    (var-set total-shares (+ (var-get total-shares) new-shares))

    ;; ;; Update wallet amount map
    (map-set wallet-shares { wallet: tx-sender } { shares: (+ current-wallet-shares new-shares) })

    ;; Transfer funds to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Add liquidity and stake LP
    (try! (as-contract (do-stx-to-stake)))

    (ok new-shares)
  )
)

;; Helper for withdraw-stx
(define-public (stx-for-shares (shares-amount uint))
  (let (
    ;; Current contract balance
    (contract-stx-balance (stx-get-balance (as-contract tx-sender)))

    ;; User shares percentage
    (shares-percentage (/ (* shares-amount u10000000000000000) (var-get total-shares)))

    ;; Amount of STX the user will receive
    (stx-to-receive (/ (* shares-percentage contract-stx-balance) u10000000000000000))
  )
    (ok stx-to-receive)
  )
)

(define-public (withdraw-stx (shares-amount uint))
  (let (
    (sender tx-sender)

    ;; Current shares
    (current-wallet-shares (get-shares-for-wallet tx-sender))

    ;; Unstake and convert all to STX
    ;; Important to do first, as next calculations depend on available STX in this contract
    (all-to-stx (unwrap-panic (as-contract (do-stake-to-stx))))

    ;; STX to receive
    (stx-to-receive (unwrap-panic (stx-for-shares shares-amount)))

  )
    (asserts! (>= current-wallet-shares shares-amount) (err ERR-INSUFFICIENT-SHARES))

    ;; Update total shares
    (var-set total-shares (- (var-get total-shares) shares-amount))

    ;; Update wallet amount map
    (map-set wallet-shares { wallet: tx-sender } { shares: (- current-wallet-shares shares-amount) })

    ;; Transfer STX
    (try! (as-contract (stx-transfer? stx-to-receive tx-sender sender)))

    ;; Add liquidity and stake LP
    (try! (as-contract (do-stx-to-stake)))

    (ok stx-to-receive)
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
    (swap-balances (unwrap-panic (contract-call? .arkadiko-swap-v1-1 get-balances .wrapped-stx-token .usda-token)))
    (balance-x (unwrap-panic (element-at swap-balances u0)))
    (balance-y (unwrap-panic (element-at swap-balances u1)))
    (stx-to-add-exact (/ (* contract-usda-balance balance-x) balance-y))
    
    ;; 5% slippage
    ;; TODO: able to set by fund controller
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
      (as-contract (contract-call? .arkadiko-swap-v1-1 swap-x-for-y .wrapped-stx-token .usda-token stx-amount min-usda-out))
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
      (as-contract (contract-call? .arkadiko-swap-v1-1 swap-y-for-x .wrapped-stx-token .usda-token usda-amount min-stx-out))
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
      (as-contract (contract-call? .arkadiko-swap-v1-1 add-to-position
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
      (as-contract (contract-call? .arkadiko-swap-v1-1 reduce-position
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

    (as-contract (contract-call? .arkadiko-auction-engine-v1-1 bid
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

    (as-contract (contract-call? .arkadiko-auction-engine-v1-1 redeem-lot-collateral
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
