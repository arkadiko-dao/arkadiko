;; @contract Auction Engine - Sells off vault collateral to raise USDA
;; @version 4.1

(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait liquidation-pool-trait .arkadiko-liquidation-pool-trait-v1.liquidation-pool-trait)
(use-trait liquidation-rewards-trait .arkadiko-liquidation-rewards-trait-v1.liquidation-rewards-trait)

;; constants
(define-constant ERR-NOT-AUTHORIZED u31401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u31002)
(define-constant ERR-AUCTION-NOT-ALLOWED u31003)
(define-constant ERR-NO-LIQUIDATION-REQUIRED u31004)
(define-constant ERR-TOKEN-TYPE-MISMATCH u31005)

;; variables
(define-data-var auction-engine-shutdown-activated bool false)
(define-data-var last-auction-id uint u0)
(define-data-var auction-fee uint u0)

(define-map auctions
  { id: uint }
  {
    id: uint,
    auction-type: (string-ascii 64),
    collateral-amount: uint,
    collateral-token: (string-ascii 12),
    collateral-address: principal,
    vault-id: uint,
    debt-to-raise: uint,
    discount: uint,
    total-collateral-sold: uint,
    total-debt-burned: uint,
    ended-at: uint,
  }
)

(define-read-only (get-auction-by-id (id uint))
  (default-to
    {
      id: u0,
      auction-type: "collateral",
      collateral-amount: u0,
      collateral-token: "",
      collateral-address: (contract-call? .arkadiko-dao get-dao-owner),
      vault-id: u0,
      debt-to-raise: u0,
      discount: u0,
      total-collateral-sold: u0,
      total-debt-burned: u0,
      ended-at: u0,
    }
    (map-get? auctions { id: id })
  )
)

(define-read-only (get-last-auction-id)
  (ok (var-get last-auction-id))
)

;; @desc check if auction open (not enough debt raised + end block height not reached)
;; @param auction-id; ID of the auction to be checked
(define-read-only (get-auction-open (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
  )
    (if (>= (get total-debt-burned auction) (get debt-to-raise auction))
      false
      true
    )
  )
)

;; @desc toggles the killswitch of the auction engine
(define-public (toggle-auction-engine-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set auction-engine-shutdown-activated (not (var-get auction-engine-shutdown-activated))))
  )
)

;; @desc check if shutdown activated
(define-read-only (shutdown-activated)
  (or
    (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated))
    (var-get auction-engine-shutdown-activated)
  )
)


;; ---------------------------------------------------------
;; Core
;; ---------------------------------------------------------

;; @desc mark vault as liquidated and start auction
;; @param vault-id; the vault to liquidate
;; @param vault-manager; vault manager
;; @param coll-type; collateral types
;; @param oracle; oracle
;; @param ft; collateral token if not STX vault
;; @param reserve; reserve to get collateral tokens from
;; @param liquidation-pool; pool to get USDA from
;; @param liquidation-rewards; contract to deposit rewards
(define-public (start-auction
  (vault-id uint)
  (vault-manager <vault-manager-trait>)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
  (liquidation-pool <liquidation-pool-trait>)
  (liquidation-rewards <liquidation-rewards-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (token-string (get collateral-token vault))
    (coll-token-address (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))))
  )
    (asserts! (not (shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! 
      (or
        (and (is-eq token-string "STX") (is-eq (contract-of ft) .xstx-token))
        (and (not (is-eq token-string "STX")) (is-eq (contract-of ft) coll-token-address))
      ) 
      (err ERR-TOKEN-TYPE-MISMATCH)
    )
    (asserts! (not (get is-liquidated vault)) (err ERR-AUCTION-NOT-ALLOWED))

    (let (
      (collateral-type (unwrap-panic (contract-call? vault-manager get-collateral-type-for-vault vault-id)))
      (collateral-to-debt-ratio (unwrap-panic (contract-call? vault-manager calculate-current-collateral-to-debt-ratio vault-id coll-type oracle true)))
      (liquidation-ratio (unwrap-panic (contract-call? coll-type get-liquidation-ratio collateral-type)))
      (amounts (unwrap-panic (as-contract (contract-call? vault-manager liquidate vault-id coll-type))))

      (updated-vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))

      (auction-id (+ (var-get last-auction-id) u1))
      (auction {
        id: auction-id,
        auction-type: "collateral",
        vault-id: vault-id,
        collateral-amount: (get ustx-amount amounts),
        collateral-token: (get collateral-token updated-vault),
        collateral-address: (contract-of ft),
        debt-to-raise: (get vault-debt amounts),
        discount: (unwrap-panic (contract-call? coll-type get-liquidation-penalty (get collateral-type updated-vault))),
        total-debt-burned: u0,
        total-collateral-sold: u0,
        ended-at: u0,
      })
    )
      (asserts! (>= liquidation-ratio collateral-to-debt-ratio) (err ERR-NO-LIQUIDATION-REQUIRED))

      ;; When freddie liquidates, xSTX tokens are minted in arkadiko-sip10-reserve-v1-1
      ;; So we need to transfer tokens to the new reserve
      (if (and (is-eq "STX" (get collateral-token vault)) (> (get stacked-tokens vault) u0))
        (begin
          (try! (contract-call? .arkadiko-dao burn-token .xstx-token (get ustx-amount amounts) .arkadiko-sip10-reserve-v1-1))
          (try! (contract-call? .arkadiko-dao mint-token .xstx-token (get ustx-amount amounts) (contract-of reserve)))
        )
        true
      )

      ;; Add auction
      (map-set auctions { id: auction-id } auction)
      (var-set last-auction-id auction-id)

      ;; Try to burn
      (try! (burn-usda auction-id oracle coll-type vault-manager ft reserve liquidation-pool liquidation-rewards))

      (print { type: "auction", action: "created", data: auction })
      (ok true)
    )
  )
)

;; @desc burn USDA for vault and get part of collateral
;; @param auction-id; the auction
;; @param oracle; oracle
;; @param coll-type; collateral types
;; @param vault-manager; vault manager
;; @param ft; collateral token if not STX vault
;; @param reserve; reserve to get collateral tokens from
;; @param liquidation-pool; pool to get USDA from
;; @param liquidation-rewards; contract to deposit rewards
(define-public (burn-usda
  (auction-id uint)
  (oracle <oracle-trait>)
  (coll-type <collateral-types-trait>)
  (vault-manager <vault-manager-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
  (liquidation-pool <liquidation-pool-trait>)
  (liquidation-rewards <liquidation-rewards-trait>)
)
  (let (
    (auction (get-auction-by-id auction-id))
    (debt-left (- (get debt-to-raise auction) (get total-debt-burned auction)))
    (burn-amounts (unwrap-panic (burn-usda-amount auction-id oracle liquidation-pool)))
    (usda-to-use (get usda-to-use burn-amounts))
    (collateral-sold (get collateral-to-sell burn-amounts))
    (collateral-fee (/ (* collateral-sold (var-get auction-fee)) u10000))
    (collateral-without-fee (- collateral-sold collateral-fee))

    (token-address (get collateral-address auction))
    (token-string (get collateral-token auction))
    (token-is-stx (is-eq token-string "STX"))
  )
    (asserts! (not (shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of liquidation-pool) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidation-pool"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of liquidation-rewards) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidation-rewards"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! 
      (or
        (and token-is-stx (is-eq (contract-of ft) .xstx-token))
        (and (not token-is-stx) (is-eq (contract-of ft) token-address))
      ) 
      (err ERR-TOKEN-TYPE-MISMATCH)
    )

    (if (is-eq usda-to-use u0)
      true
      (begin
        ;; Get USDA from fund
        (try! (as-contract (contract-call? liquidation-pool withdraw usda-to-use)))

        ;; Burn USDA, get collateral token
        (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token usda-to-use (as-contract tx-sender))))
        (try! (as-contract (contract-call? vault-manager redeem-auction-collateral ft token-string reserve collateral-sold (as-contract tx-sender)))) 

        ;; Deposit collateral token
        (try! (as-contract (contract-call? liquidation-rewards add-reward block-height token-is-stx ft collateral-without-fee)))

        ;; Update auction
        (map-set auctions { id: auction-id } (merge auction {
          total-collateral-sold: (+ (get total-collateral-sold auction) collateral-sold),
          total-debt-burned: (+ (get total-debt-burned auction) usda-to-use)
        }))

        true
      )
    )

    ;; Try to finalize
    (try! (finalize-liquidation auction-id vault-manager coll-type))

    (print { type: "auction", action: "burn-usda", data: auction })
    (ok usda-to-use)
  )
)

;; @desc finalize liquidation so rest of collateral becomes available to vault owner
;; @param auction-id; the auction
;; @param vault-manager; vault manager
;; @param coll-type; collateral types
(define-public (finalize-liquidation
  (auction-id uint)
  (vault-manager <vault-manager-trait>)
  (coll-type <collateral-types-trait>)
)
  (let (
    (auction (get-auction-by-id auction-id))
  )
    (asserts! (not (shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))

    ;; Sell off DIKO if needed
    (try! (sell-diko auction-id))

    ;; Do not continue if auction still open
    (asserts! (not (get-auction-open auction-id)) (ok false))

    ;; Finalize liquidation
    (try! (as-contract (contract-call?
      vault-manager
      finalize-liquidation
      (get vault-id auction)
      (- (get collateral-amount auction) (get total-collateral-sold auction))
      coll-type
    )))
    (map-set auctions { id: auction-id } (merge (get-auction-by-id auction-id) { ended-at: block-height }))
  
    (print { type: "auction", action: "finalize-liquidation", data: auction })
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Helpers
;; ---------------------------------------------------------

;; If all collateral sold but still debt to raise,
;; DIKO is minted and swapped to USDA to pay off debt
(define-private (sell-diko (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (all-collateral-sold (is-eq (get collateral-amount auction) (get total-collateral-sold auction)))
    (debt-left (if (>= (get total-debt-burned auction) (get debt-to-raise auction))
      u0
      (- (get debt-to-raise auction) (get total-debt-burned auction))
    ))
  )
    ;; Stop if not all collateral sold, no debt to raise or auction not open
    (asserts! all-collateral-sold (ok u0))
    (asserts! (> debt-left u0) (ok u0))
    (asserts! (get-auction-open auction-id) (ok u0))
    
    (let (
      (pair-details (unwrap-panic (unwrap-panic (contract-call? .arkadiko-swap-v2-1 get-pair-details .arkadiko-token .usda-token))))
      (diko-price (/ (* (get balance-x pair-details) u1100000) (get balance-y pair-details))) ;; 10% extra 
      (diko-to-mint (/ (* debt-left diko-price) u1000000))
    )
      ;; Mint DIKO
      (try! (as-contract (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-to-mint (as-contract tx-sender))))

      ;; Swap DIKO to USDA
      (try! (as-contract (contract-call? .arkadiko-swap-v2-1 swap-x-for-y .arkadiko-token .usda-token diko-to-mint u0)))

      ;; Burn USDA
      (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token debt-left (as-contract tx-sender))))

      ;; Swap leftover USDA to DIKO
      (let ((leftover-usda (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender)))))
        (try! (as-contract (contract-call? .arkadiko-swap-v2-1 swap-y-for-x .arkadiko-token .usda-token leftover-usda u0)))
      )

      ;; Burn leftover DIKO
      (let ((leftover-diko (unwrap-panic (contract-call? .arkadiko-token get-balance (as-contract tx-sender)))))
        (try! (as-contract (contract-call? .arkadiko-dao burn-token .arkadiko-token leftover-diko (as-contract tx-sender))))
      )

      ;; Update auction
      (map-set auctions { id: auction-id } (merge auction {
        total-debt-burned: (+ (get total-debt-burned auction) debt-left)
      }))

      (print { type: "auction", action: "sell-diko", data: diko-to-mint })
      (ok diko-to-mint)
    )
  )
)


;; @desc calculate the amount of USDA to burn 
;; @param auction-id; the ID of the auction for which the collateral amount should be calculated
;; @param oracle; the oracle implementation that provides the on-chain price
;; @param liquidation-pool; the pool that holds USDA to use in liquidations
(define-public (burn-usda-amount
  (auction-id uint)
  (oracle <oracle-trait>)
  (liquidation-pool <liquidation-pool-trait>)
)
  (let (
    (auction (get-auction-by-id auction-id))
    (debt-left (- (get debt-to-raise auction) (get total-debt-burned auction)))
    (collateral-left (- (get collateral-amount auction) (get total-collateral-sold auction)))
    (collateral-price (unwrap-panic (get-collateral-discounted-price oracle auction-id)))

    (usda-for-collateral (/ (* collateral-left collateral-price) u1000000))
    (usda-withdrawable (unwrap-panic (contract-call? liquidation-pool max-withdrawable-usda)))
    (usda-to-use (min-of (min-of debt-left usda-for-collateral) usda-withdrawable))
    (collateral-to-sell (/ (* usda-to-use u1000000) collateral-price))
  )
    (ok { usda-to-use: usda-to-use, collateral-to-sell: collateral-to-sell })
  )
)

;; @desc calculate the collateral price taking into account the liquidation discount
;; @param oracle; the oracle implementation that provides the on-chain price
;; @param auction-id; the ID of the auction for which the collateral amount should be calculated
(define-public (get-collateral-discounted-price (oracle <oracle-trait>) (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (collateral-price (unwrap-panic (contract-call? oracle fetch-price (get collateral-token auction))))
    (decimals (if (> (get decimals collateral-price) u0)
      (get decimals collateral-price)
      u1000000
    ))
    (discount (get discount auction))
    (price (get last-price collateral-price))
    (discounted-price (- price (/ (* price discount) (/ decimals u100))))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (ok (/ (* discounted-price u1000000) decimals))
  )
)

(define-private (min-of (x uint) (y uint))
  (if (< x y)
    x
    y
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------


(define-public (withdraw-fees (ft <ft-trait>))
  (let (
    (sender tx-sender)
    (contract-balance (unwrap-panic (contract-call? ft get-balance (as-contract tx-sender))))
  )
    (asserts! (is-eq sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (as-contract (contract-call? ft transfer contract-balance (as-contract tx-sender) sender none))
  )
)

(define-public (update-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (var-set auction-fee new-fee)
    (ok new-fee)
  )
)
