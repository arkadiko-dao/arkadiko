;; @contract Auction Engine - Sells off vault collateral to raise USDA
;; @version 1

(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait auction-engine-trait .arkadiko-auction-engine-trait-v2.auction-engine-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)

;; constants
(define-constant ERR-NOT-AUTHORIZED u31401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u31002)
(define-constant ERR-AUCTION-NOT-ALLOWED u31003)
(define-constant ERR-NO-LIQUIDATION-REQUIRED u31004)
(define-constant ERR-TOKEN-TYPE-MISMATCH u31005)

;; variables
(define-data-var auction-engine-shutdown-activated bool false)
(define-data-var last-auction-id uint u0)

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

(define-read-only (shutdown-activated)
  (or
    (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated))
    (var-get auction-engine-shutdown-activated)
  )
)


(define-public (start-auction
  (vault-id uint)
  (vault-manager <vault-manager-trait>)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
  )
    (asserts! (not (shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-AUCTION-NOT-ALLOWED))

    (let (
      (collateral-type (unwrap-panic (contract-call? vault-manager get-collateral-type-for-vault vault-id)))
      (collateral-to-debt-ratio (unwrap-panic (contract-call? vault-manager calculate-current-collateral-to-debt-ratio vault-id coll-type oracle true)))
      (liquidation-ratio (unwrap-panic (contract-call? coll-type get-liquidation-ratio collateral-type)))
      (amounts (unwrap-panic (as-contract (contract-call? vault-manager liquidate vault-id coll-type))))

      (auction-id (+ (var-get last-auction-id) u1))
      (auction {
        id: auction-id,
        auction-type: "collateral",
        vault-id: vault-id,
        collateral-amount: (get ustx-amount amounts),
        collateral-token: (get collateral-token vault),
        collateral-address: (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))),
        debt-to-raise: (get vault-debt amounts),
        discount: (unwrap-panic (contract-call? coll-type get-liquidation-penalty (get collateral-type vault))),
        total-debt-burned: u0,
        total-collateral-sold: u0,
        ended-at: u0,
      })
    )
      (asserts! (>= liquidation-ratio collateral-to-debt-ratio) (err ERR-NO-LIQUIDATION-REQUIRED))

      ;; Add auction
      (map-set auctions { id: auction-id } auction)

      ;; Try to burn
      (try! (burn-usda auction-id oracle coll-type vault-manager ft reserve))

      (print { type: "auction", action: "created", data: auction })
      (ok true)
    )
  )
)

(define-public (burn-usda
  (auction-id uint)
  (oracle <oracle-trait>)
  (coll-type <collateral-types-trait>)
  (vault-manager <vault-manager-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
)
  (let (
    (auction (get-auction-by-id auction-id))
    (debt-left (- (get debt-to-raise auction) (get total-debt-burned auction)))
    (usda-to-use (withdrawable-usda debt-left))
    (collateral-sold (unwrap-panic (get-collateral-amount oracle auction-id usda-to-use)))

    (token-string (if (is-eq (get collateral-token auction) "STX") "xSTX" (get collateral-token auction)))
    (token-address (get collateral-address auction))
  )
    (asserts! (not (shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (or (is-eq (contract-of ft) token-address) (is-eq "xSTX" token-string)) (err ERR-TOKEN-TYPE-MISMATCH))

    (if (is-eq usda-to-use u0)
      true
      (begin
        ;; Get USDA from fund
        (try! (as-contract (contract-call? .arkadiko-liquidation-pool-v1-1 withdraw usda-to-use)))

        ;; Burn USDA, get collateral token
        (try! (contract-call? .arkadiko-dao burn-token .usda-token usda-to-use (as-contract tx-sender)))
        (try! (contract-call? vault-manager redeem-auction-collateral ft token-string reserve collateral-sold tx-sender)) 

        ;; Deposit collateral token
        (try! (contract-call? .arkadiko-liquidation-rewards-v1-1 add-reward block-height ft collateral-sold))

        ;; Update auction
        (map-set auctions { id: auction-id } (merge auction {
          total-collateral-sold: (+ (get total-collateral-sold auction) collateral-sold),
          total-debt-burned: (+ (get total-debt-burned auction) usda-to-use)
        }))

        true
      )
    )

    ;; Try to finalize
    (unwrap-panic (finalize-liquidation auction-id vault-manager coll-type))

    (print { type: "auction", action: "burn-usda", data: auction })
    (ok usda-to-use)
  )
)

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

    (if (get-auction-open auction-id)
      (ok false)
      (begin
        (try! (contract-call?
          vault-manager
          finalize-liquidation
          (get vault-id auction)
          (- (get collateral-amount auction) (get total-collateral-sold auction))
          coll-type
        ))
        (map-set auctions { id: auction-id } (merge auction { ended-at: block-height }))
      
        (print { type: "auction", action: "finalize-liquidation", data: auction })
        (ok true)
      )
    )
  )
)

;; @desc calculates the collateral amount to sell
;; e.g. if we need to cover 10 USDA debt, and we have 20 STX at $1/STX,
;; we only need to auction off 10 STX excluding an additional discount
;; @param oracle; the oracle implementation that provides the on-chain price
;; @param auction-id; the ID of the auction for which the collateral amount should be calculated
(define-public (get-collateral-amount (oracle <oracle-trait>) (auction-id uint) (debt uint))
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
    (ok (/ (* debt decimals) discounted-price))
  )
)

(define-private (withdrawable-usda (needed-usda uint))
  (let (
    (max-usda (contract-call? .arkadiko-liquidation-pool-v1-1 max-withdrawable-usda))
  )
    (if (> needed-usda max-usda)
      max-usda
      needed-usda
    )
  )
)

(define-private (min-of (x uint) (y uint))
  (if (< x y)
    x
    y
  )
)