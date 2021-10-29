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
(define-constant ERR-INSUFFICIENT-FUNDS-TO-BID u25003)

;; Variables
(define-data-var fund-owner principal tx-sender)
(define-data-var total-shares uint u0)
(define-data-var max-stx-to-stake uint u0)
(define-data-var cumm-reward-per-share uint u0)

;; ---------------------------------------------------------
;; Wallet funds
;; ---------------------------------------------------------

(define-map wallet-shares-stx 
   { wallet: principal } 
   {
      shares: uint
   }
)

(define-read-only (get-total-shares)
  (var-get total-shares)
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
    ;; TODO: this is not correct, part of funds might be in LP
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
    ;; TODO: this is not correct, part of funds might be in LP
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
;; DIKO rewards
;; ---------------------------------------------------------

(define-map wallet-cumm-reward-per-share 
   { staker: principal } 
   {
      cumm-reward-per-share: uint
   }
)

(define-read-only (get-stake-cumm-reward-per-share-of (staker principal))
  (get cumm-reward-per-share 
    (default-to
      { cumm-reward-per-share: u0 }
      (map-get? wallet-cumm-reward-per-share { staker: staker })
    )
  )
)

(define-public (claim-stake-rewards)
  (claim-pending-rewards tx-sender)
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
    ;; Claim all pending rewards for staker so we can set the new cumm-reward for this user
    (try! (claim-pending-rewards tx-sender))

    ;; Update cumm reward per stake now that total is updated
    (unwrap-panic (increase-cumm-reward-per-share))

    ;; Update sender stake info
    (map-set wallet-cumm-reward-per-share { staker: tx-sender } { cumm-reward-per-share: (var-get cumm-reward-per-share) })


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

    ;; Claim all pending rewards for staker so we can set the new cumm-reward for this user
    (try! (claim-pending-rewards sender))

    ;; Update cumm reward per stake now that total is updated
    (unwrap-panic (increase-cumm-reward-per-share))

    ;; Update sender stake info
    (map-set wallet-cumm-reward-per-share { staker: sender } { cumm-reward-per-share: (var-get cumm-reward-per-share) })


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

    (try! (as-contract (contract-call? .arkadiko-auction-engine-v1-1 bid
      vault-manager
      oracle
      coll-type
      auction-id
      lot-index
      usda
    )))

    (stake-contract-funds)
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
;; Swap helpers
;; ---------------------------------------------------------

;; Get how much STX would be needed as input for given USDA output
(define-public (swap-stx-needed-for-usda-output (usda-output uint))
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

;; ---------------------------------------------------------
;; Token management
;; ---------------------------------------------------------


;; Make USDA available to contract to make bid
(define-private (make-usda-available (usda-amount uint))
  (let (
    ;; Check if unstaked funds can be used
    (usda-available-from-funds (unwrap-panic (make-usda-available-from-funds usda-amount)))
  )
    (if (is-eq usda-available-from-funds false)
      ;; Make staked funds available
      (make-usda-available-from-stake usda-amount)
      (ok true)
    )
  )
)

;; Use contract funds to make given USDA available
;; By swapping STX for USDA if needed
(define-private (make-usda-available-from-funds (usda-amount uint))
 (let (
    (contract-usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    (contract-stx-balance (get-liquidation-fund-stx-balance))
  )
    ;; If contract holds enough USDA there is nothing left to do
    (if (< contract-usda-balance usda-amount)

      (let (
        (usda-needed-from-swap (- usda-amount contract-usda-balance))
        (stx-needed-to-swap (unwrap-panic (swap-stx-needed-for-usda-output usda-needed-from-swap)))
      )
        ;; If contract holds enough STX it can be swapped for USDA
        (if (>= contract-stx-balance stx-needed-to-swap)

          ;; Swap STX for USDA
          (begin
            (try! (as-contract (contract-call? .arkadiko-swap-v1-1 swap-x-for-y .wrapped-stx-token .usda-token stx-needed-to-swap usda-needed-from-swap)))
            (ok true)
          )

          ;; Not enough USDA or STX in contract
          (ok false)
        )
      )
      
      ;; Enough USDA in contract    
      (ok true) 
    )
  )
)

;; Unstake and remove liquidity to make STX and USDA available
;; Makes sure the requested USDA amount is available to make a bid
(define-private (make-usda-available-from-stake (usda-amount uint))

  (let (
    (stake-balance (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 get-stake-amount-of (as-contract tx-sender)))
  )
    (if (> stake-balance u0)
      (begin

        ;; Unstake
        (try! (as-contract (contract-call? .arkadiko-stake-registry-v1-1 unstake 
          .arkadiko-stake-registry-v1-1 
          .arkadiko-stake-pool-wstx-usda-v1-1 
          .arkadiko-swap-token-wstx-usda 
          stake-balance
        )))

        ;; Remove liquidity
        (try! (as-contract (contract-call? .arkadiko-swap-v1-1 reduce-position
          .wrapped-stx-token
          .usda-token
          .arkadiko-swap-token-wstx-usda
          u100
        )))

        ;; Now try to make USDA available from contract funds
        (make-usda-available-from-funds usda-amount)
      )
    
      ;; Not enough funds to make bid
      (err ERR-INSUFFICIENT-FUNDS-TO-BID)
    )
  )
)

;; ---------------------------------------------------------
;; Stake funds
;; ---------------------------------------------------------

;; Stake funds
(define-private (stake-contract-funds)
  (let (
    ;; Get the right amount of STX and USDA
    (stx-to-stake (unwrap-panic (prepare-stake-contract-funds)))
  )
    (if (is-eq stx-to-stake u0)
      (ok true)

      (begin
        ;; Add liquidity
        (try! (as-contract (contract-call? .arkadiko-swap-v1-1 add-to-position
          .wrapped-stx-token
          .usda-token
          .arkadiko-swap-token-wstx-usda
          stx-to-stake
          u0
        )))

        ;; Stake LP tokens
        (let (
          (lp-balance (unwrap-panic (contract-call? .arkadiko-swap-token-wstx-usda get-balance (as-contract tx-sender))))
        )
          (try! (as-contract (contract-call? .arkadiko-stake-registry-v1-1 stake
            .arkadiko-stake-registry-v1-1 
            .arkadiko-stake-pool-wstx-usda-v1-1 
            .arkadiko-swap-token-wstx-usda 
            lp-balance
          )))
          (ok true)
        )
      )

    )
  )
)

;; Make sure to have STX and USDA to provide liquidity and stake
;; This is done by first converting all USDA to STX
;; Half of the STX used for staking is converted to USDA
;; Returns the amount of STX that can be used to stake
(define-private (prepare-stake-contract-funds)
  (let (
    (contract-usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
  )
    ;; Swap all USDA from contract to STX first
    (if (> contract-usda-balance u0)
      (begin
        (try! (as-contract (contract-call? .arkadiko-swap-v1-1 swap-y-for-x .wrapped-stx-token .usda-token contract-usda-balance u0)))
        true
      )
      true
    )

    ;; Swap part of STX for USDA
    (let (      
      (stx-to-swap (/ (get-max-stx-to-stake) u2))
      (stx-to-swap-with-extra (/ (* stx-to-swap u105) u100)) ;; 5% extra for fees & slippage
    )
      (try! (as-contract (contract-call? .arkadiko-swap-v1-1 swap-x-for-y .wrapped-stx-token .usda-token stx-to-swap-with-extra u0)))
      (ok stx-to-swap)
    )
  )
)

;; Calculate max STX to stake
;; Keep 5% for fees and slippage
(define-read-only (get-max-stx-to-stake)
  (let (
    (contract-stx-balance (get-liquidation-fund-stx-balance))
    (max-set (var-get max-stx-to-stake))
  )
    (if (> max-set contract-stx-balance)
      (/ (* contract-stx-balance u95) u100)
      (/ (* max-set u95) u100)
    )
  )
)


;; ---------------------------------------------------------
;; Rewards
;; ---------------------------------------------------------


(define-public (get-pending-rewards (staker principal))
  (let (
    (shares-amount (get-shares-stx-for-wallet staker))
    (amount-owed-per-token (- (unwrap-panic (calculate-cumm-reward-per-share)) (get-stake-cumm-reward-per-share-of staker)))
    (rewards-decimals (* shares-amount amount-owed-per-token))
    (rewards (/ rewards-decimals u1000000))
  )
    (ok rewards)
  )
)

(define-private (claim-pending-rewards (staker principal))
  (begin

    (unwrap-panic (increase-cumm-reward-per-share))

    (let (
      (pending-rewards (unwrap-panic (get-pending-rewards staker)))
    )
      (if (>= pending-rewards u1)
        (begin
          (try! (as-contract (contract-call? .arkadiko-token transfer pending-rewards tx-sender staker none)))

          (map-set wallet-cumm-reward-per-share { staker: tx-sender } { cumm-reward-per-share: (var-get cumm-reward-per-share) })

          (ok pending-rewards)
        )
        (ok u0)
      )
    )
  )
)

(define-public (increase-cumm-reward-per-share)
  (let (
    (new-cumm-reward-per-share (unwrap-panic (calculate-cumm-reward-per-share)))
  )
    (var-set cumm-reward-per-share new-cumm-reward-per-share)
    (ok new-cumm-reward-per-share)
  )
)

(define-public (calculate-cumm-reward-per-share)
  (let (
    (current-total-shares (var-get total-shares))
    (current-cumm-reward-per-share (var-get cumm-reward-per-share)) 
  )
    (if (> current-total-shares u0)
      (let (
        (total-rewards-to-distribute (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender))))
        (new-cumm-reward-per-share (/ (* total-rewards-to-distribute u1000000) current-total-shares))
      )
        (ok new-cumm-reward-per-share)
      )
      (ok current-cumm-reward-per-share)
    )
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; Transfer ownership
(define-public (set-fund-owner (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))
    (ok (var-set fund-owner address))
  )
)

;; Set max amount of STX that can be used to stake
(define-public (set-max-stx-to-stake (max-stx uint))
  (begin
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set max-stx-to-stake max-stx)
    (stake-contract-funds)
  )
)

;; Claim staking rewards if any
(define-public (claim-contract-staking-rewards)
  (begin
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))
    (as-contract (contract-call? .arkadiko-stake-registry-v1-1 claim-pending-rewards .arkadiko-stake-registry-v1-1 .arkadiko-stake-pool-wstx-usda-v1-1))
  )
)

;; Get pending staking rewards
(define-public (get-contract-pending-staking-rewards)
  (begin
    (asserts! (is-eq tx-sender (var-get fund-owner)) (err ERR-NOT-AUTHORIZED))
    (as-contract (contract-call? .arkadiko-stake-registry-v1-1 get-pending-rewards .arkadiko-stake-registry-v1-1 .arkadiko-stake-pool-wstx-usda-v1-1))
  )
)
