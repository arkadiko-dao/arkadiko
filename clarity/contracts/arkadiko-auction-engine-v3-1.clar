;; @contract Auction Engine - Sells off vault collateral to raise USDA
;; @version 1

(impl-trait .arkadiko-auction-engine-trait-v2.auction-engine-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait auction-engine-trait .arkadiko-auction-engine-trait-v2.auction-engine-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)

;; constants
(define-constant blocks-per-day u144)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u213)
(define-constant ERR-CANNOT-WITHDRAW u21)
(define-constant ERR-ALREADY-REDEEMED u22)
(define-constant ERR-WITHDRAWAL-AMOUNT-EXCEEDED u23)

;; variables
(define-data-var auction-engine-shutdown-activated bool false)
(define-data-var total-commitments uint u0) ;; total micro-amount of USDA committed to the auction engine
(define-data-var last-auction-id uint u0)
(define-data-var last-liquidation uint u0) ;; block height when last liquidation happened

(define-map auction-redemptions
  { user: principal, auction-id: uint }
  { redeemed: bool }
)
(define-map usda-commitment
  { user: principal }
  { uamount: uint, last-collateral-redeemed: uint, last-withdrawal: uint }
)
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
    ends-at: uint
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
      ends-at: u0,
    }
    (map-get? auctions { id: id })
  )
)

(define-read-only (get-commitment-by-user (user principal))
  (default-to
    {
      uamount: u0,
      last-collateral-redeemed: u0,
      last-withdrawal: u0
    }
    (map-get? usda-commitment { user: user })
  )
)

(define-read-only (get-auction-redemption-by-user (user principal) (auction-id uint))
  (default-to
    {
      redeemed: false
    }
    (map-get? auction-redemptions { user: user, auction-id: auction-id })
  )
)

;; @desc check if auction open (not enough debt raised + end block height not reached)
;; @param auction-id; ID of the auction to be checked
(define-read-only (get-auction-open (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
  )
    (if
      (or
        (>= block-height (get ends-at auction))
        (>= (get total-debt-raised auction) (get debt-to-raise auction))
      )
      (ok false)
      (ok true)
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

(define-public (deposit (uamount uint))
  (let (
    (commitment (get-commitment-by-user tx-sender))
    (last-collateral-redeemed (if (> (get uamount commitment) u0)
      (get last-collateral-redeemed commitment)
      u0
    ))
    (last-withdraw (if (> (get uamount commitment) u0)
      (get last-withdrawal commitment)
      u0
    ))
  )
    (try! (contract-call? .usda-token transfer uamount tx-sender (as-contract tx-sender)))
    (var-set total-commitments (+ (var-get total-commitments) uamount))
    (map-set usda-commitment { user: tx-sender } {
      uamount: (+ (get uamount commitment) uamount),
      last-collateral-redeemed: last-collateral-redeemed,
      last-withdrawal: last-withdrawal
    })
    (ok true)
  )
)

;; you can only withdraw if you redeemed all your collateral, and thus your share of the pool is updated
(define-public (withdraw (uamount uint))
  (let (
    (commitment (get-commitment-by-user tx-sender))
  )
    (asserts! (> (get last-collateral-redeemed commitment) last-liquidation) (err ERR-CANNOT-WITHDRAW))
    (asserts! (>= (get uamount commitment) uamount) (err ERR-WITHDRAWAL-AMOUNT-EXCEEDED))
    (map-set usda-commitment
      { user: tx-sender }
      (merge commitment { uamount: (- (get uamount commitment) uamount), last-withdrawal: block-height })
    )
    (var-set total-commitments (- (var-get total-commitments) uamount))
    (ok true)
  )
)

(define-public (start-auction
  (vault-id uint)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
  (uamount uint)
  (extra-debt uint)
  (vault-debt uint)
  (discount uint)
)
  (let ((vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id)))
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidator"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) true) (err ERR-AUCTION-NOT-ALLOWED))
    (asserts!
      (and
        (not (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)))
        (not (var-get auction-engine-shutdown-activated))
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (let (
      (auction-id (+ (var-get last-auction-id) u1))
      (auction {
        id: auction-id,
        auction-type: "collateral",
        vault-id: vault-id,
        collateral-amount: uamount,
        collateral-token: (get collateral-token vault),
        collateral-address: (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))),
        debt-to-raise: (+ extra-debt vault-debt),
        discount: discount,
        total-debt-raised: u0
      })
    )
      (map-set auctions { id: auction-id } auction)
      (print { type: "auction", action: "created", data: auction })
      (if (>= (var-get total-commitments) (+ extra-debt vault-debt))
        (try! (burn-usda auction-id oracle (+ extra-debt vault-debt)))
        (if (> (var-get total-commitments) u0)
          (try! (burn-usda auction-id oracle (var-get total-commitments)))
          false
        )
      )

      (var-set last-auction-id (+ (var-get last-auction-id) u1))
      (ok true)
    )
  )
)

(define-private (burn-usda (auction-id uint) (oracle <oracle-trait>) (left-to-raise uint))
  (let (
    (auction (get-auction-by-id auction-id))
  )
    (begin
      ;; buy up whatever is left in the fund
      (try! (contract-call? .arkadiko-dao burn-token .usda-token left-to-raise (as-contract tx-sender)))
      (var-set last-liquidation block-height)
      (map-set auctions
        { id: auction-id }
        (merge auction {
          ended-at: block-height,
          total-collateral-sold: (get-collateral-amount oracle left-to-raise discount),
          total-debt-raised: (+ (get total-debt-raised auction) left-to-raise)
        })
      )
      (var-set total-commitments (- (var-get total-commitments) left-to-raise))
    )
  )
)

(define-public (finish-auction
  (vault-id uint)
  (oracle <oracle-trait>)
)
  (let (
    (auction (get-auction-by-id auction-id))
    (left-to-raise (- (get auction debt-to-raise) (get auction total-debt-raised)))
  )
    (if (>= left-to-raise (var-get total-commitments))
      (try! (burn-usda auction-id oracle left-to-raise))
      false
    )
    (ok true)
  )
)

;; @desc calculates the collateral amount to sell
;; e.g. if we need to cover 10 USDA debt, and we have 20 STX at $1/STX,
;; we only need to auction off 10 STX excluding an additional discount
;; @param oracle; the oracle implementation that provides the on-chain price
;; @param auction-id; the ID of the auction for which the collateral amount should be calculated
(define-public (get-collateral-amount (oracle <oracle-trait>) (debt uint) (discount uint))
  (let (
    (collateral-price (unwrap-panic (contract-call? oracle fetch-price (collateral-token (get collateral-token auction)))))
    (discounted-price (/ (- (* u100 price) discount) u1000000))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (ok (/ debt discounted-price))
  )
)

(define-public (redeem-tokens
  (vault-manager <vault-manager-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
)
  (let (
    (auction (get-auction-by-id auction-id))
    (redemption (get-auction-redemption-by-user tx-sender auction-id))
    (token-address (get collateral-address auction))
    (token-string (get collateral-token auction))
    (current-commitment (get-commitment-by-user tx-sender))
    (commitment (at-block (get-block-info? id-header-hash (get ended-at auction)) (get-commitment-by-user tx-sender)))
    (total-commitments (at-block (get-block-info? id-header-hash (get ended-at auction)) (var-get total-commitments)))
    (share (/ (get uamount commitment) total-commitments))
    (tokens (/ (* share (get total-collateral-sold auction)) u10000))
  )
    (asserts! (not (unwrap-panic (get-auction-open auction-id))) (err ERR-AUCTION-NOT-CLOSED))
    (asserts! (not (get redeemed redemption)) (err ERR-ALREADY-REDEEMED))
    (asserts! (< (get last-withdrawal current-commitment) (var-get last-liquidation)) (err ERR-ALREADY-REDEEMED)) ;; TODO - update error
    (asserts!
      (or
        (is-eq (contract-of ft) token-address)
        (is-eq "STX" token-string)
        (is-eq "xSTX" token-string)
      )
      (err ERR-TOKEN-TYPE-MISMATCH)
    )
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (if (> tokens u0)
      (begin
        (try! (contract-call? vault-manager redeem-auction-collateral ft token-string reserve tokens tx-sender))
        (map-set usda-commitment { user: tx-sender } { uamount: u0, last-collateral-redeemed: block-height }) ;; TODO - update uamount
      )
      false
    )
    (ok true)
  )
)
