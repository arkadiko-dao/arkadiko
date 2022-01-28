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

;; variables
(define-data-var auction-engine-shutdown-activated bool false)
(define-data-var total-commitments uint u0)

(define-map usda-commitment
  { user: principal }
  { uamount: uint }
)
(define-map auctions
  { id: uint }
  {
    id: uint,
    auction-type: (string-ascii 64),
    collateral-amount: uint,
    collateral-token: (string-ascii 12),
    collateral-address: principal,
    debt-to-raise: uint,
    discount: uint,
    vault-id: uint,
    lot-size: uint,
    lots-sold: uint,
    total-collateral-sold: uint,
    total-debt-raised: uint,
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
      debt-to-raise: u0,
      discount: u0,
      vault-id: u0,
      lot-size: u0,
      lots-sold: u0,
      total-collateral-sold: u0,
      total-debt-raised: u0,
      total-debt-burned: u0,
      ends-at: u0,
    }
    (map-get? auctions { id: id })
  )
)

(define-read-only (get-commitment-by-user (user principal))
  (default-to
    {
      uamount: u0
    }
    (map-get? usda-commitment { user: user })
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
  )
    (try! (contract-call? .usda-token transfer uamount tx-sender (as-contract tx-sender)))
    (var-set total-commitments (+ (var-get total-commitments) uamount))
    (map-set usda-commitment { user: tx-sender } { uamount: (+ (get uamount commitment) uamount) })
    (ok true)
  )
)

(define-public (start-auction
  (vault-id uint)
  (coll-type <collateral-types-trait>)
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
        total-commitments: (var-get total-commitments),
        discount: discount,
        ended-at: block-height, ;; TODO - do not set if not enough USDA to buy all debt
        total-collateral-sold: u0,
        total-debt-raised: u0,
        total-debt-burned: u0
      })
    )
      (map-set auctions { id: auction-id } auction )
      (print { type: "auction", action: "created", data: auction })
      (if (>= (var-get total-commitments) (+ extra-debt vault-debt))
        (begin
          ;; buy up the whole vault
          ;; burn the USDA
          (try! (contract-call? .arkadiko-dao burn-token .usda-token (+ extra-debt vault-debt) (as-contract tx-sender)))
          (var-set total-commitments (- (var-get total-commitments) (+ extra-debt vault-debt)))
        )
        false
      )
      (ok true)
    )
  )
)

(define-public (redeem-tokens (auction-id principal))
  (let (
    (auction (get-auction-by-id auction-id))
  )
    ;; TODO - asserts auction ended
    (at-block (get-block-info? id-header-hash (get ended-at auction)) (get-commitment-by-user tx-sender))
    (ok true)
  )
)

;; @desc redeem USDA to burn DIKO gov token from open market
;; taken from auctions, paid by liquidation penalty on vaults
;; @param usda-amount; the amount of USDA to be redeemed from the contract
;; @post usda; all USDA tokens will have been transferred to DAO's payout address
(define-public (redeem-usda (usda-amount uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (as-contract (contract-call? .usda-token transfer usda-amount tx-sender (contract-call? .arkadiko-dao get-payout-address) none))
  )
)
