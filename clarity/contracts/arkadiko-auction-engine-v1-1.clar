;; @contract Auction Engine - Sells off vault collateral to raise USDA
;; @version 1

(impl-trait .arkadiko-auction-engine-trait-v1.auction-engine-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait auction-engine-trait .arkadiko-auction-engine-trait-v1.auction-engine-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)

;; errors
(define-constant ERR-LOT-NOT-OPEN u21)
(define-constant ERR-LOT-SOLD u22)
(define-constant ERR-POOR-BID u23)
(define-constant ERR-AUCTION-NOT-ALLOWED u25)
(define-constant ERR-NOT-AUTHORIZED u2403)
(define-constant ERR-AUCTION-NOT-OPEN u28)
(define-constant ERR-BLOCK-HEIGHT-NOT-REACHED u29)
(define-constant ERR-AUCTION-NOT-CLOSED u210)
(define-constant ERR-LOT-ALREADY-REDEEMED u211)
(define-constant ERR-TOKEN-TYPE-MISMATCH u212)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u213)

(define-constant blocks-per-day u144)

(define-map auctions
  { id: uint }
  {
    id: uint,
    auction-type: (string-ascii 64),
    collateral-amount: uint,
    collateral-token: (string-ascii 12),
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
(define-map bids
  { auction-id: uint, lot-index: uint }
  {
    usda: uint,
    collateral-amount: uint,
    collateral-token: (string-ascii 12),
    owner: principal,
    redeemed: bool
  }
)

(define-map winning-lots
  { user: principal }
  { ids: (list 100 (tuple (auction-id uint) (lot-index uint))) }
)
(define-map redeeming-lot
  { auction-id: uint, lot-index: uint }
  { bidder: principal }
)

(define-data-var last-auction-id uint u0)
(define-data-var auction-ids (list 1500 uint) (list u0))
(define-data-var lot-size uint u1000000000) ;; 1000 USDA
(define-data-var auction-engine-shutdown-activated bool false)
(define-data-var removing-auction-id uint u0)

(define-read-only (get-auction-by-id (id uint))
  (default-to
    {
      id: u0,
      auction-type: "collateral",
      collateral-amount: u0,
      collateral-token: "",
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

;; @desc get all auctions that are currently open
(define-read-only (get-auctions)
  (ok (map get-auction-by-id (var-get auction-ids)))
)

;; @desc get all auction IDs of auctions that are currently open
(define-read-only (get-auction-ids)
  (ok (var-get auction-ids))
)

;; @desc get the last bid on certain a lot of an auction 
;; @param aution-id; ID of the auction
;; @param lot-index; index of the lot in the auction
(define-read-only (get-last-bid (auction-id uint) (lot-index uint))
  (default-to
    {
      usda: u0,
      collateral-amount: u0,
      collateral-token: "",
      owner: (contract-call? .arkadiko-dao get-dao-owner),
      redeemed: false
    }
    (map-get? bids { auction-id: auction-id, lot-index: lot-index })
  )
)

;; @desc get all winning lots for a principal
;; @param owner; principal of the lot winner
(define-read-only (get-winning-lots (owner principal))
  (default-to
    { ids: (list (tuple (auction-id u0) (lot-index u0))) }
    (map-get? winning-lots { user: owner })
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


;; @desc ;; 1. Create auction object in map per 100 USDA
;; 2. Add auction ID to list (to show in UI)
;; we want to sell as little collateral as possible to cover the vault's debt
;; if we cannot cover the vault's debt with the collateral sale,
;; we will have to sell some governance or STX tokens from the reserve
;; @param vault-id; ID of the vault that got liquidated for which an auction needs to be started
;; @param uamount; the total amount of collateral that can be sold off in the auction
;; @param extra-debt; the extra debt penalty that has to be raised on top of the vault debt
;; @param vault-debt; the debt in the vault that is now considered bad debt since it is not sufficiently collateralised
;; @param discount; the discount to be given in an auction on the collateral to keepers
;; @post auction; a new auction will be created that runs for one day
(define-public (start-auction (vault-id uint) (uamount uint) (extra-debt uint) (vault-debt uint) (discount uint))
  (let ((vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id)))
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidator"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) true) (err ERR-AUCTION-NOT-ALLOWED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (let (
      (auction-id (+ (var-get last-auction-id) u1))
      (auction {
        id: auction-id,
        auction-type: "collateral",
        collateral-amount: uamount,
        collateral-token: (get collateral-token vault),
        debt-to-raise: (+ extra-debt vault-debt),
        discount: discount,
        vault-id: vault-id,
        lot-size: (var-get lot-size),
        lots-sold: u0,
        ends-at: (+ block-height blocks-per-day),
        total-collateral-sold: u0,
        total-debt-raised: u0,
        total-debt-burned: u0
      })
    )
      (map-set auctions { id: auction-id } auction )
      (var-set auction-ids (unwrap-panic (as-max-len? (append (var-get auction-ids) auction-id) u1500)))
      (var-set last-auction-id auction-id)
      (print { type: "auction", action: "created", data: auction })
      (ok true)
    )
  )
)




;; @desc start an auction to sell off DIKO governance tokens
;; this is a private function since it should only be called
;; when a normal collateral liquidation auction can't raise enough debt to cover the vault's debt
;; @param vault-id; ID of the vault for which not enough USDA could be raised
;; @param debt-to-raise; the amount of debt left to raise after running the initial collateral auction
;; @param discount; the discount on the DIKO collateral to the keepers
;; @post auction; a new auction will be created that runs for one day
(define-private (start-debt-auction (vault-id uint) (debt-to-raise uint) (discount uint))
  (let ((vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id)))
    (asserts! (is-eq (get is-liquidated vault) true) (err ERR-AUCTION-NOT-ALLOWED))

    (let (
      (auction-id (+ (var-get last-auction-id) u1))
      (auction {
        id: auction-id,
        auction-type: "debt",
        collateral-amount: (* debt-to-raise u1000000),
        collateral-token: "DIKO",
        debt-to-raise: debt-to-raise,
        discount: discount,
        vault-id: vault-id,
        lot-size: (var-get lot-size),
        lots-sold: u0,
        ends-at: (+ block-height blocks-per-day),
        total-collateral-sold: u0,
        total-debt-raised: u0,
        total-debt-burned: u0
      })
    )
      (map-set auctions { id: auction-id } auction)
      (var-set auction-ids (unwrap-panic (as-max-len? (append (var-get auction-ids) auction-id) u1500)))
      (var-set last-auction-id auction-id)
      (print { type: "auction", action: "created", data: auction })
    )
    (ok true)
  )
)

;; @desc calculate the discounted auction price on the (dollarcent) price of the collateral
;; @param price; the current on-chain price
;; @param auction-id; the ID of the auction in which the collateral will be sold
(define-read-only (discounted-auction-price (price uint) (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (discount (* price (get discount auction)))
  )
    (ok (/ (- (* u100 price) discount) u1000000))
  )
)

;; @desc calculates the minimum collateral amount to sell
;; e.g. if we need to cover 10 USDA debt, and we have 20 STX at $1/STX,
;; we only need to auction off 10 STX excluding an additional discount
;; @param oracle; the oracle implementation that provides the on-chain price
;; @param auction-id; the ID of the auction for which the collateral amount should be calculated
(define-public (get-minimum-collateral-amount (oracle <oracle-trait>) (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (collateral-amount-auction (get collateral-amount auction))
    (collateral-sold (get total-collateral-sold auction))
    (collateral-left
      (if (> collateral-amount-auction collateral-sold)
        (- collateral-amount-auction collateral-sold)
        u0
      )
    )
    (debt-to-raise (get debt-to-raise auction))
    (total-debt-raised (get total-debt-raised auction))
    (debt-left-to-raise
      (if (> debt-to-raise total-debt-raised)
        (- debt-to-raise total-debt-raised)
        u0
      )
    )
    (collateral-price (unwrap-panic (contract-call? oracle fetch-price (collateral-token (get collateral-token auction)))))
    (discounted-price (unwrap-panic (discounted-auction-price (get last-price collateral-price) auction-id)))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (if (< debt-left-to-raise (get lot-size auction))
      (let ((collateral-amount (/ (* u100 debt-left-to-raise) discounted-price)))
        (if (> collateral-amount collateral-left)
          (ok collateral-left)
          (ok collateral-amount)
        )
      )
      (let ((collateral-amount (/ (* u100 (get lot-size auction)) discounted-price)))
        (if (> collateral-amount collateral-left)
          (ok collateral-left)
          (ok collateral-amount)
        )
      )
    )
  )
)

;; @desc bid a certain USDA amount on a lot in an auction
;; @param vault-manager; the contract that manages the vault for which the collateral is sold off
;; @param oracle; the oracle that provides on-chain prices for the collateral that is sold off
;; @param coll-type; the contract that implements the parameters of the collateral types compatible with Arkadiko vaults
;; @param auction-id; the ID of the auction that is bid on
;; @param lot-index; the ID of the lot that is bid on in the auction
;; @param usda; the amount of USDA that is bid. If an amount equal to the lot size (usually 1000 USDA) is bid, the lot is automatically won
;; @post usda; the usda amount will be transferred from the tx-sender to this contract
;; @post bid; the lot will be assigned to the current bidder
;; @post stacker-payout; if the STX are being stacked, the yield will go to the keeper pro-rata to the amount of USDA the keeper bought
(define-public (bid
  (vault-manager <vault-manager-trait>)
  (oracle <oracle-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
  (lot-index uint)
  (usda uint)
)
  (let ((auction (get-auction-by-id auction-id)))
    (asserts! (is-eq lot-index (get lots-sold auction)) (err ERR-LOT-NOT-OPEN))
    (asserts! (is-eq (unwrap-panic (get-auction-open auction-id)) true) (err ERR-AUCTION-NOT-OPEN))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (register-bid vault-manager oracle coll-type auction-id lot-index usda)
  )
)

;; @desc allows lot bidders to redeem the collateral they won after an auction has closed
;; @param vault-manager; the contract that manages the vault for which the collateral is sold off
;; @param ft; the fungible token that was sold off (either a SIP10 token or STX)
;; @param reserve; the reserve that stores the fungible tokens (collateral) that were sold off
;; @param coll-type; the contract that implements the parameters of the collateral types compatible with Arkadiko vaults
;; @param auction-id; the ID of the auction that from which the collateral will be redeemed
;; @param lot-index; the ID of the lot that was won and will now be redeemed
;; @post stx/sip10; will be transferred to the tx-sender if they won the lot
(define-public (redeem-lot-collateral
  (vault-manager <vault-manager-trait>)
  (ft <ft-trait>)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
  (lot-index uint)
)
  (let (
    (last-bid (get-last-bid auction-id lot-index))
    (auction (get-auction-by-id auction-id))
    (token-string (get collateral-token auction))
  )
    (asserts!
      (or
        (is-eq (unwrap-panic (contract-call? ft get-symbol)) token-string)
        (is-eq "STX" token-string)
        (is-eq "xSTX" token-string)
      )
      (err ERR-TOKEN-TYPE-MISMATCH)
    )
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq tx-sender (get owner last-bid)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (unwrap-panic (get-auction-open auction-id)) false) (err ERR-AUCTION-NOT-CLOSED))
    (asserts! (is-eq (get redeemed last-bid) false) (err ERR-LOT-ALREADY-REDEEMED))

    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; Update bid
    (map-set bids
      { auction-id: auction-id, lot-index: lot-index }
      (merge last-bid {
        redeemed: true
      })
    )

    (if (is-eq (get auction-type auction) "debt")
      ;; request "collateral-amount" gov tokens from the DAO
      (begin
        (try! (contract-call? .arkadiko-dao request-diko-tokens (get collateral-amount last-bid)))
        (try! (contract-call? vault-manager redeem-auction-collateral ft token-string reserve (get collateral-amount last-bid) tx-sender))
      )
      (try! (contract-call? vault-manager redeem-auction-collateral ft token-string reserve (get collateral-amount last-bid) tx-sender))
    )
    (if (< (get usda last-bid) (var-get lot-size))
      (begin
        (map-set auctions
          { id: auction-id }
          (merge auction {
            lots-sold: (+ u1 (get lots-sold auction)),
          })
        )
        (try! (close-auction vault-manager coll-type auction-id))
      )
      false
    )

    (print { type: "lot", action: "redeemed", data: { auction-id: auction-id, lot-index: lot-index } })
    (ok true)
  )
)

;; @desc closes an auction
;; 1. flag auction on map as closed
;; 2. allow person to collect collateral from reserve manually
;; 3. check if vault debt is covered (sum of USDA in lots >= debt-to-raise)
;; 4. update vault to allow vault owner to withdraw leftover collateral (if any)
;; 5. if not all vault debt is covered: auction off collateral again (if any left)
;; 6. if not all vault debt is covered and no collateral is left: cover USDA with gov token
;; @param vault-manager; the contract that manages the vault for which the collateral was sold off
;; @param coll-type; the contract that implements the parameters of the collateral types compatible with Arkadiko vaults
;; @param auction-id: the ID of the auction that should be closed
(define-public (close-auction
  (vault-manager <vault-manager-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
)
  (let ((auction (get-auction-by-id auction-id)))
    (asserts!
      (or
        (>= block-height (get ends-at auction))
        (>= (get total-debt-raised auction) (get debt-to-raise auction))
      )
      (err ERR-BLOCK-HEIGHT-NOT-REACHED)
    )
    (asserts! (is-eq (unwrap-panic (get-auction-open auction-id)) false) (err ERR-AUCTION-NOT-CLOSED))
    (asserts! (is-eq (contract-of vault-manager) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get auction-engine-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (let (
      (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id (get vault-id auction)))
    )
      (if (> (get debt vault) (get total-debt-burned auction))
        (let (
          (amount-to-burn (min-of (- (get total-debt-raised auction) (get total-debt-burned auction)) (- (get debt vault) (get total-debt-burned auction))))
        )
          (if (> amount-to-burn u0)
            (try! (contract-call? .arkadiko-dao burn-token .usda-token amount-to-burn (as-contract tx-sender)))
            true
          )
          (map-set auctions
            { id: auction-id }
            (merge auction { total-debt-burned: (+ (get total-debt-burned auction) amount-to-burn) })
          )
        )
        true
      )
    )
    (try!
      (if (>= (get total-debt-raised auction) (get debt-to-raise auction))
        (begin
          (unwrap-panic (remove-auction auction-id))
          (if (is-eq (get auction-type auction) "collateral")
            (contract-call?
              vault-manager
              finalize-liquidation
              (get vault-id auction)
              (- (get collateral-amount auction) (get total-collateral-sold auction))
              coll-type
            )
            (contract-call?
              vault-manager
              finalize-liquidation
              (get vault-id auction)
              u0
              coll-type
            )
          )
        )
        (if (< (get total-collateral-sold auction) (get collateral-amount auction)) ;; we have some collateral left to auction
          ;; extend auction with collateral that is left
          (extend-auction auction-id)
          (begin
            ;; no collateral left. Need to sell governance token to raise more USDA
            (unwrap-panic (remove-auction auction-id))
            (start-debt-auction
              (get vault-id auction)
              (- (get debt-to-raise auction) (get total-debt-raised auction))
              u0
            )
          )
        )
      )
    )
    (print { type: "auction", action: "closed", data: { auction-id: auction-id } })
    (ok true)
  )
)

;; @desc called when upgrading contracts
;; auction engine should only contain USDA from bids
;; @param auction-engine; the contract of the new auction engine
;; @param token; the token contract that specifies the FT to transfer, usually will be usda-token
;; @post ft; all the tokens will have been transferred to the new contract
(define-public (migrate-funds (auction-engine <auction-engine-trait>) (token <ft-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (let (
      (balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
    )
      (as-contract (contract-call? token transfer balance tx-sender (contract-of auction-engine) none))
    )
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


;;;;;;;;;;;;;;;;;;;;;;;
;; private functions ;;
;;;;;;;;;;;;;;;;;;;;;;;

(define-private (collateral-token (token (string-ascii 12)))
  (if (is-eq token "xSTX")
    "STX"
    token
  )
)

(define-private (min-of (i1 uint) (i2 uint))
  (if (< i1 i2)
    i1
    i2
  )
)

(define-private (register-bid
  (vault-manager <vault-manager-trait>)
  (oracle <oracle-trait>)
  (coll-type <collateral-types-trait>)
  (auction-id uint)
  (lot-index uint)
  (usda uint)
)
  (let (
    (auction (get-auction-by-id auction-id))
    (last-bid (get-last-bid auction-id lot-index))
    (collateral-amount (unwrap-panic (get-minimum-collateral-amount oracle auction-id)))
    (lot-got-sold (if (>= usda (var-get lot-size))
        u1
        u0
      )
    )
    (lots (get-winning-lots tx-sender))
  )
    ;; Lot is sold once bid is > lot-size
    (asserts! (< (get usda last-bid) (var-get lot-size)) (err ERR-LOT-SOLD))
    ;; Need a better bid than previously already accepted
    (asserts! (> usda (get usda last-bid)) (err ERR-POOR-BID)) 

    ;; Return USDA of last bid to (now lost) bidder
    (if (> (get usda last-bid) u0)
      (try! (return-usda (get owner last-bid) (get usda last-bid) auction-id lot-index))
      true
    )
    ;; Transfer USDA from liquidator to this contract
    (try! (contract-call? .usda-token transfer usda tx-sender (as-contract tx-sender) none))

    ;; Update auctions
    (map-set auctions
      { id: auction-id }
      (merge auction {
        lots-sold: (+ lot-got-sold (get lots-sold auction)),
        total-collateral-sold: (- (+ collateral-amount (get total-collateral-sold auction)) (get collateral-amount last-bid)),
        total-debt-raised: (- (+ usda (get total-debt-raised auction)) (get usda last-bid))
      })
    )
    ;; Update bids
    (map-set bids
      { auction-id: auction-id, lot-index: lot-index }
      {
        usda: usda,
        collateral-amount: collateral-amount,
        collateral-token: (get collateral-token auction),
        owner: tx-sender,
        redeemed: false
      }
    )
    (map-set winning-lots
      { user: tx-sender }
      {
        ids: (unwrap-panic (as-max-len? (append (get ids lots) (tuple (auction-id auction-id) (lot-index lot-index))) u100))
      }
    )

    ;; Set stacker payout
    (try! (contract-call? .arkadiko-vault-data-v1-1 set-stacker-payout (get vault-id auction) lot-index collateral-amount tx-sender))
    (print { type: "bid", action: "registered", data: { auction-id: auction-id, lot-index: lot-index, usda: usda } })

    ;; End auction if needed
    (if
      (or
        (>= block-height (get ends-at auction))
        (>= (- (+ usda (get total-debt-raised auction)) (get usda last-bid)) (get debt-to-raise auction))
      )
      ;; auction is over - close all bids
      ;; send collateral to winning bidders
      (close-auction vault-manager coll-type auction-id)
      (ok true)
    )
  )
)

(define-private (remove-winning-lot (lot (tuple (auction-id uint) (lot-index uint))))
  (if (is-some (map-get? redeeming-lot { auction-id: (get auction-id lot), lot-index: (get lot-index lot) }))
    false
    true
  )
)

(define-private (return-usda (owner principal) (usda uint) (auction-id uint) (lot-index uint))
  (if (> usda u0)
    (let ((lots (get-winning-lots owner)))
      (map-set redeeming-lot { auction-id: auction-id, lot-index: lot-index } { bidder: owner })
      (map-set winning-lots { user: owner } { ids: (filter remove-winning-lot (get ids lots)) })
      (try! (as-contract (contract-call? .usda-token transfer usda (as-contract tx-sender) owner none)))
      (ok (map-delete redeeming-lot { auction-id: auction-id, lot-index: lot-index }))
    )
    (err u0) ;; don't really care if this fails.
  )
)

(define-private (extend-auction (auction-id uint))
  (let ((auction (get-auction-by-id auction-id)))
    (map-set auctions
      { id: auction-id }
      (merge auction {
        total-debt-burned: (get total-debt-raised auction),
        ends-at: (+ (get ends-at auction) blocks-per-day)
      })
    )
    (ok true)
  )
)

(define-private (remove-auction (auction-id uint))
  (begin
    (var-set removing-auction-id auction-id)
    (var-set auction-ids (unwrap-panic (as-max-len? (filter remove-closed-auction (var-get auction-ids)) u1500)))
    (ok true)
  )
)

(define-private (remove-closed-auction (auction-id uint))
  (if (is-eq auction-id (var-get removing-auction-id))
    false
    true
  )
)
