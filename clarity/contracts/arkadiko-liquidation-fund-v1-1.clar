;; @contract fund to perform liquidations
;; @version 1.1

(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED u25001)
(define-constant ERR-INSUFFICIENT-SHARES u25002)
(define-constant ERR-INSUFFICIENT-STX-TO-SWAP u25003)

;; Variables
(define-data-var fund-owner principal tx-sender)
(define-data-var total-shares uint u0)

;; ---------------------------------------------------------
;; Wallet funds
;; ---------------------------------------------------------

(define-map wallet-shares-stx 
   { wallet: principal } 
   {
      shares: uint
   }
)

(define-read-only (get-shares-stx-for-wallet (wallet principal))
  (default-to 
    u0
    (get shares (map-get? wallet-shares-stx { wallet: wallet }) )
  )
)

;; ---------------------------------------------------------
;; Shares
;; ---------------------------------------------------------

;; STX (deposit & rewards) over total shares
;; Result with 6 decimals
(define-read-only (stx-shares-ratio)
  (let (
    (contract-stx-balance (stx-get-balance (as-contract tx-sender)))
  )
    (if (is-eq (var-get total-shares) u0)
      (ok u1000000)
      (ok (/ (* contract-stx-balance u1000000) (var-get total-shares)))
    )
  )
)

;; STX to get for given shares
(define-read-only (shares-for-stx (shares-amount uint))
  (let (
    ;; STX in contract
    (contract-stx-balance (stx-get-balance (as-contract tx-sender)))

    ;; User shares percentage
    (shares-percentage (/ (* shares-amount u1000000) (var-get total-shares)))

    ;; Amount of STX the user will receive
    (stx-to-receive (/ (* shares-percentage contract-stx-balance) u1000000))
  )
    (ok stx-to-receive)
  )
)

;; ---------------------------------------------------------
;; Deposit and withdraw
;; ---------------------------------------------------------

(define-public (deposit-stx (amount uint))
  (let (
    ;; STX/shares 
    (stx-per-shares (unwrap-panic (stx-shares-ratio)))

    ;; Calculate amount of shares to receive
    (shares-to-receive (/ (* amount u1000000) stx-per-shares))

    ;; Current shares
    (current-wallet-shares (get-shares-stx-for-wallet tx-sender))
  )
    ;; Update total shares
    (var-set total-shares (+ (var-get total-shares) shares-to-receive))

    ;; Update wallet amount map
    (map-set wallet-shares-stx { wallet: tx-sender } { shares: (+ current-wallet-shares shares-to-receive) })

    ;; Transfer funds to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    (ok shares-to-receive)
  )
)

(define-public (withdraw-stx (shares-amount uint))
  (let (
    (sender tx-sender)

    ;; Current shares
    (current-wallet-shares (get-shares-stx-for-wallet tx-sender))

    ;; STX to receive
    (stx-to-receive (unwrap-panic (shares-for-stx shares-amount)))
  )
    (asserts! (>= current-wallet-shares shares-amount) (err ERR-INSUFFICIENT-SHARES))

    ;; Update total shares
    (var-set total-shares (- (var-get total-shares) shares-amount))

    ;; Update wallet amount map
    (map-set wallet-shares-stx { wallet: tx-sender } { shares: (- current-wallet-shares shares-amount) })

    ;; Transfer STX to owner
    (try! (as-contract (stx-transfer? stx-to-receive tx-sender sender)))

    (ok stx-to-receive)
  )
)

(define-read-only (get-liquidation-fund-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; ---------------------------------------------------------
;; Auction actions
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
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (make-usda-available usda))

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
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))

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
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))

    (as-contract (contract-call? .arkadiko-freddie-v1-1 redeem-stx
      ustx-amount
    ))
  )
)

;; ---------------------------------------------------------
;; Token management
;; ---------------------------------------------------------

(define-public (stx-needed-for-usda-output (usda-output uint))
  (let (
    (pair-balances (unwrap-panic (contract-call? .arkadiko-swap-v1-1 get-balances .wrapped-stx-token .usda-token)))
    (pair-wstx-balance (unwrap-panic (element-at pair-balances u0)))
    (pair-usda-balance (unwrap-panic (element-at pair-balances u1)))
    (stx-input (/ (* usda-output pair-wstx-balance) pair-usda-balance))
    (stx-input-with-extra (/ (* stx-input u105) u100)) ;; 5% extra for fees & slippage
  )
    (ok stx-input-with-extra)
  )
)

(define-private (make-usda-available (usda-amount uint))
  (let (
    (contract-usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    (contract-stx-balance (get-liquidation-fund-stx-balance))

    (usda-needed-from-swap (- usda-amount contract-usda-balance))
    (stx-needed-to-swap (unwrap-panic (stx-needed-for-usda-output usda-needed-from-swap)))
  )
    (if (< contract-usda-balance usda-amount)

      ;; Not enough USDA in contract
      (if (>= contract-stx-balance stx-needed-to-swap)

        ;; Swap STX for USDA
        (begin
          (try! (as-contract (contract-call? .arkadiko-swap-v1-1 swap-x-for-y .wrapped-stx-token .usda-token stx-needed-to-swap usda-needed-from-swap)))
          (ok true)
        )

        ;; Not enough STX in contract to swap
        (err ERR-INSUFFICIENT-STX-TO-SWAP)
      )

      ;; Enough USDA in contract    
      (ok true) 
    )
  )
)


;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-fund-owner (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set fund-owner address))
  )
)
