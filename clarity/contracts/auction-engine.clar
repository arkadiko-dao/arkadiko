(use-trait vault-trait .vault-trait.vault-trait)
(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)

;; errors
(define-constant err-bid-declined u1)
(define-constant err-lot-sold u2)
(define-constant err-poor-bid u3)
(define-constant err-xusd-transfer-failed u4)
(define-constant err-auction-not-allowed u5)
(define-constant err-insufficient-collateral u6)
(define-constant err-not-authorized u7)
(define-constant ERR-AUCTION-NOT-ENDED u8)
(define-constant ERR-BLOCK-HEIGHT-NOT-REACHED u9)
(define-constant ERR-COULD-NOT-REDEEM u10)
(define-constant ERR-DIKO-REQUEST-FAILED u11)

(define-map auctions
  { id: uint }
  {
    id: uint,
    auction-type: (string-ascii 64),
    collateral-amount: uint,
    collateral-token: (string-ascii 12),
    debt-to-raise: uint,
    vault-id: uint,
    lot-size: uint,
    lots-sold: uint,
    is-open: bool,
    total-collateral-sold: uint,
    total-debt-raised: uint,
    ends-at: uint
  }
)
(define-map bids
  { auction-id: uint, lot-index: uint }
  {
    xusd: uint,
    collateral-amount: uint,
    collateral-token: (string-ascii 12),
    owner: principal,
    is-accepted: bool
  }
)
(define-map winning-lots
  { user: principal }
  { ids: (list 100 (tuple (auction-id uint) (lot-index uint))) }
)
(define-map redeeming-lot
  { user: principal }
  { auction-id: uint, lot-index: uint }
)

(define-data-var last-auction-id uint u0)
(define-data-var auction-ids (list 1800 uint) (list u0))
(define-data-var lot-size uint u100000000) ;; 100 xUSD

(define-read-only (get-auction-by-id (id uint))
  (unwrap!
    (map-get? auctions { id: id })
    (tuple
      (id u0)
      (auction-type "collateral")
      (collateral-amount u0)
      (collateral-token "")
      (debt-to-raise u0)
      (vault-id u0)
      (lot-size u0)
      (lots-sold u0)
      (is-open false)
      (total-collateral-sold u0)
      (total-debt-raised u0)
      (ends-at u0)
    )
  )
)

(define-read-only (get-auctions)
  (ok (map get-auction-by-id (var-get auction-ids)))
)

;; 1. Create auction object in map per 100 xUSD
;; 2. Add auction ID to list (to show in UI)
;; we wanna sell as little collateral as possible to cover the vault's debt
;; if we cannot cover the vault's debt with the collateral sale,
;; we will have to sell some governance or STX tokens from the reserve
(define-public (start-auction (vault-id uint) (uamount uint) (debt-to-raise uint))
  (let ((vault (contract-call? .freddie get-vault-by-id vault-id)))
    (asserts! (is-eq contract-caller .liquidator) (err err-not-authorized))
    (asserts! (is-eq (get is-liquidated vault) true) (err err-auction-not-allowed))

    (let ((auction-id (+ (var-get last-auction-id) u1)))
      (begin
        (map-set auctions
          { id: auction-id }
          {
            id: auction-id,
            auction-type: "collateral",
            collateral-amount: uamount,
            collateral-token: (get collateral-token vault),
            debt-to-raise: debt-to-raise,
            vault-id: vault-id,
            lot-size: (var-get lot-size),
            lots-sold: u0,
            ends-at: (+ block-height u144),
            total-collateral-sold: u0,
            total-debt-raised: u0,
            is-open: true
          }
        )
        (print "Added new open auction")
        (var-set auction-ids (unwrap-panic (as-max-len? (append (var-get auction-ids) auction-id) u1800)))
        (var-set last-auction-id auction-id)
        (ok true)
      )
    )
  )
)

;; start an auction to sell off DIKO gov tokens
;; this is a private function since it should only be called
;; when a normal collateral liquidation auction can't raise enough debt
(define-private (start-debt-auction (vault-id uint) (debt-to-raise uint))
  (let ((vault (contract-call? .freddie get-vault-by-id vault-id)))
    (asserts! (is-eq (get is-liquidated vault) true) (err err-auction-not-allowed))

    (let (
      (auction-id (+ (var-get last-auction-id) u1))
      (price-in-cents u10)
    )
      (map-set auctions
        { id: auction-id }
        {
          id: auction-id,
          auction-type: "debt",
          collateral-amount: (/ (* u100 debt-to-raise) price-in-cents),
          collateral-token: "diko",
          debt-to-raise: debt-to-raise,
          vault-id: vault-id,
          lot-size: (var-get lot-size),
          lots-sold: u0,
          ends-at: (+ block-height u144),
          total-collateral-sold: u0,
          total-debt-raised: u0,
          is-open: true
        }
      )

      (print "Added new open auction")
      (var-set auction-ids (unwrap-panic (as-max-len? (append (var-get auction-ids) auction-id) u1800)))
      (var-set last-auction-id auction-id)
    )
    (ok true)
  )
)

(define-public (start-surplus-auction (xusd-amount uint))
  (let (
    (auction-id (+ (var-get last-auction-id) u1))
    (maximum-surplus (unwrap-panic (contract-call? .dao get-maximum-debt-surplus)))
    (current-balance (unwrap-panic (contract-call? .freddie get-xusd-balance)))
  )
    (asserts! (>= current-balance maximum-surplus) (err err-auction-not-allowed))
    ;; TODO: add assert to run only 1 surplus auction at once

    (map-set auctions
      { id: auction-id }
      {
        id: auction-id,
        auction-type: "surplus",
        collateral-amount: xusd-amount,
        collateral-token: "xusd",
        debt-to-raise: u0, ;; no specific amount of debt should be raised
        vault-id: u0,
        lot-size: (var-get lot-size),
        lots-sold: u0,
        ends-at: (+ block-height u14),
        total-collateral-sold: u0,
        total-debt-raised: u0,
        is-open: true
      }
    )

    (print "Added new open auction")
    (var-set auction-ids (unwrap-panic (as-max-len? (append (var-get auction-ids) auction-id) u1800)))
    (var-set last-auction-id auction-id)
    (ok true)
  )
)

(define-read-only (discounted-auction-price (price-in-cents uint))
  ;; price * 3% = price * 3 / 100
  (let ((discount (* price-in-cents u3)))
    (ok (/ (- (* u100 price-in-cents) discount) u100))
  )
)

(define-read-only (collateral-token (token (string-ascii 12)))
  (if (is-eq token "xstx")
    "stx"
    token
  )
)

;; calculates the minimum collateral amount to sell
;; e.g. if we need to cover 10 xUSD debt, and we have 20 STX at $1/STX,
;; we only need to auction off 10 STX
;; but we give a 3% discount to incentivise people
(define-read-only (calculate-minimum-collateral-amount (auction-id uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (price-in-cents (contract-call? .oracle get-price (collateral-token (get collateral-token auction))))
    (collateral-left (- (get collateral-amount auction) (get total-collateral-sold auction)))
    (debt-left-to-raise (- (get debt-to-raise auction) (get total-debt-raised auction)))
  )
    (if (< debt-left-to-raise (get lot-size auction))
      (begin
        (let ((collateral-amount (/ (* u100 debt-left-to-raise) (unwrap-panic (discounted-auction-price (get last-price-in-cents price-in-cents))))))
          (if (> collateral-amount collateral-left)
            (ok collateral-left)
            (ok collateral-amount)
          )
        )
      )
      (begin
        (let ((collateral-amount (/ (* u100 (get lot-size auction)) (unwrap-panic (discounted-auction-price (get last-price-in-cents price-in-cents))))))
          (if (> collateral-amount collateral-left)
            (ok collateral-left)
            (ok collateral-amount)
          )
        )
      )
    )
  )
)

(define-read-only (get-last-bid (auction-id uint) (lot-index uint))
  (unwrap!
    (map-get? bids { auction-id: auction-id, lot-index: lot-index })
    (tuple
      (xusd u0)
      (collateral-amount u0)
      (collateral-token "")
      (owner (get-owner))
      (is-accepted false)
    )
  )
)

(define-read-only (get-winning-lots (owner principal))
  (unwrap!
    (map-get? winning-lots { user: owner })
    (tuple
      (ids (list (tuple (auction-id u0) (lot-index u0))))
    )
  )
)

(define-public (bid (auction-id uint) (lot-index uint) (xusd uint))
  (let ((auction (get-auction-by-id auction-id)))
    (if
      (and
        (is-eq lot-index (get lots-sold auction))
        (is-eq (get is-open auction) true)
      )
      (ok (register-bid auction-id lot-index xusd))
      (err err-bid-declined) ;; just silently exit
    )
  )
)

(define-private (register-bid (auction-id uint) (lot-index uint) (xusd uint))
  (let ((auction (get-auction-by-id auction-id)))
    (let ((last-bid (get-last-bid auction-id lot-index)))
      (if (not (get is-accepted last-bid))
        (if (> xusd (get xusd last-bid)) ;; we have a better bid and the previous one was not accepted!
          (ok (accept-bid auction-id lot-index xusd))
          (err err-poor-bid) ;; don't care cause either the bid is already over or it was a poor bid
        )
        (err err-lot-sold) ;; lot is already sold
      )
    )
  )
)

(define-private (is-lot-sold (accepted-bid bool))
  (if accepted-bid
    (ok u1)
    (ok u0)
  )
)

(define-private (accept-bid (auction-id uint) (lot-index uint) (xusd uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (last-bid (get-last-bid auction-id lot-index))
    (collateral-amount (unwrap-panic (calculate-minimum-collateral-amount auction-id)))
    (accepted-bid
      (or
        (is-eq xusd (get lot-size auction))
        (>= xusd (- (get debt-to-raise auction) (get total-debt-raised auction)))
      )
    )
  )
    ;; if this bid is at least (total debt to raise / lot-size) amount, accept it as final - we don't need to be greedy
    (begin
      (if (> (get xusd last-bid) u0)
        (try! (return-xusd (get owner last-bid) (get xusd last-bid))) ;; return xUSD of last bid to (now lost) bidder
        true
      )
      (try! (contract-call? .xusd-token transfer xusd tx-sender (as-contract tx-sender)))
      (begin
        (map-set auctions
          { id: auction-id }
          {
            id: auction-id,
            auction-type: (get auction-type auction),
            collateral-amount: (get collateral-amount auction),
            collateral-token: (get collateral-token auction),
            debt-to-raise: (get debt-to-raise auction),
            vault-id: (get vault-id auction),
            lot-size: (get lot-size auction),
            lots-sold: (+ (unwrap-panic (is-lot-sold accepted-bid)) (get lots-sold auction)),
            ends-at: (get ends-at auction),
            total-collateral-sold: (- (+ collateral-amount (get total-collateral-sold auction)) (get collateral-amount last-bid)),
            total-debt-raised: (- (+ xusd (get total-debt-raised auction)) (get xusd last-bid)),
            is-open: true
          }
        )
        (map-set bids
          { auction-id: auction-id, lot-index: lot-index }
          {
            xusd: xusd,
            collateral-amount: collateral-amount,
            collateral-token: (get collateral-token auction),
            owner: tx-sender,
            is-accepted: accepted-bid
          }
        )
        (if accepted-bid
          (begin
            (let ((lots (get-winning-lots tx-sender)))
              (map-set winning-lots
                { user: tx-sender }
                {
                  ids: (unwrap-panic (as-max-len? (append (get ids lots) (tuple (auction-id auction-id) (lot-index lot-index))) u100))
                }
              )
            )
          )
          true
        )
        (if
          (or
            (>= block-height (get ends-at auction))
            (>= (- (+ xusd (get total-debt-raised auction)) (get xusd last-bid)) (get debt-to-raise auction))
          )
          ;; auction is over - close all bids
          ;; send collateral to winning bidders
          (ok (unwrap! (close-auction auction-id) (err u666)))
          (ok false)
        )
      )
    )
  )
)

(define-private (remove-winning-lot (lot (tuple (auction-id uint) (lot-index uint))))
  (let ((current-lot (unwrap-panic (map-get? redeeming-lot { user: tx-sender }))))
    (if 
      (and
        (is-eq (get auction-id lot) (get auction-id current-lot))
        (is-eq (get lot-index lot) (get lot-index current-lot))
      )
      false
      true
    )
  )
)

(define-public (redeem-lot-collateral (ft <mock-ft-trait>) (reserve <vault-trait>) (auction-id uint) (lot-index uint))
  (let (
    (last-bid (get-last-bid auction-id lot-index))
    (auction (get-auction-by-id auction-id))
  )
    (if
      (and
        (is-eq tx-sender (get owner last-bid))
        (get is-accepted last-bid)
      )
      (begin
        (let ((lots (get-winning-lots tx-sender)))
          (map-set redeeming-lot { user: tx-sender } { auction-id: auction-id, lot-index: lot-index})
          (if (map-set winning-lots { user: tx-sender } { ids: (filter remove-winning-lot (get ids lots)) })
            (begin
              (if (is-eq (get auction-type auction) "debt")
                ;; request "collateral-amount" gov tokens from the DAO
                (begin
                  (try! (contract-call? .dao request-diko-tokens ft (get collateral-amount auction)))
                  (contract-call? .freddie redeem-auction-collateral ft reserve (get collateral-amount last-bid) tx-sender)
                )
                (contract-call? .freddie redeem-auction-collateral ft reserve (get collateral-amount last-bid) tx-sender)
              )
            )
            (err ERR-COULD-NOT-REDEEM)
          )
        )
      )
      (err ERR-COULD-NOT-REDEEM)
    )
  )
)

(define-private (return-xusd (owner principal) (xusd uint))
  (if (> xusd u0)
    (ok (unwrap-panic (as-contract (contract-call? .xusd-token transfer xusd (as-contract tx-sender) owner))))
    (err u0) ;; don't really care if this fails.
  )
)

;; DONE     1. flag auction on map as closed
;; DONE     2. allow person to collect collateral from reserve manually
;; DONE     3. check if vault debt is covered (sum of xUSD in lots >= debt-to-raise)
;; DONE     4. update vault to allow vault owner to withdraw leftover collateral (if any)
;; DONE     5. if not all vault debt is covered: auction off collateral again (if any left)
;; TODO     6. if not all vault debt is covered and no collateral is left: cover xUSD with gov token
(define-public (close-auction (auction-id uint))
  (let ((auction (get-auction-by-id auction-id)))
    (asserts!
      (or
        (>= block-height (get ends-at auction))
        (>= (get total-debt-raised auction) (get debt-to-raise auction))
      )
      (err ERR-BLOCK-HEIGHT-NOT-REACHED)
    )
    (asserts! (is-eq (get is-open auction) true) (err ERR-AUCTION-NOT-ENDED))

    (map-set auctions
      { id: auction-id }
      {
        id: auction-id,
        auction-type: (get auction-type auction),
        collateral-amount: (get collateral-amount auction),
        collateral-token: (get collateral-token auction),
        debt-to-raise: (get debt-to-raise auction),
        vault-id: (get vault-id auction),
        lot-size: (get lot-size auction),
        lots-sold: (get lots-sold auction),
        ends-at: (get ends-at auction),
        total-collateral-sold: (get total-collateral-sold auction),
        total-debt-raised: (get total-debt-raised auction),
        is-open: false
      }
    )
    (try! (contract-call? .xusd-token burn (get total-debt-raised auction) (as-contract tx-sender)))
    (if (>= (get total-debt-raised auction) (get debt-to-raise auction))
      (begin
        (contract-call?
          .freddie
          finalize-liquidation
          (get vault-id auction)
          (- (get collateral-amount auction) (get total-collateral-sold auction))
          (get total-debt-raised auction)
        )
      )
      (begin
        (if (< (get total-collateral-sold auction) (get collateral-amount auction)) ;; we have some collateral left to auction
          ;; start new auction with collateral that is left
          (start-auction
            (get vault-id auction)
            (- (get collateral-amount auction) (get total-collateral-sold auction))
            (- (get debt-to-raise auction) (get total-debt-raised auction))
          )
          ;; no collateral left. Need to sell governance token to raise more xUSD
          (start-debt-auction
            (get vault-id auction)
            (- (get debt-to-raise auction) (get total-debt-raised auction))
          )
        )
      )
    )
  )
)

(define-public (unlock-winning-lots (auction-id uint) (lot-index uint))
  (let (
    (auction (get-auction-by-id auction-id))
    (last-bid (get-last-bid auction-id lot-index))
    (lots (get-winning-lots (get owner last-bid)))
  )
    (asserts! (is-eq (get is-open auction) false) (err err-not-authorized))
    (asserts! (> (get xusd last-bid) u0) (err err-not-authorized))
    (asserts! (is-eq (get is-accepted last-bid) false) (err err-not-authorized))

    (map-set auctions
      { id: auction-id }
      {
        id: auction-id,
        auction-type: (get auction-type auction),
        collateral-amount: (get collateral-amount auction),
        collateral-token: (get collateral-token auction),
        debt-to-raise: (get debt-to-raise auction),
        vault-id: (get vault-id auction),
        lot-size: (get lot-size auction),
        lots-sold: (+ u1 (get lots-sold auction)),
        ends-at: (get ends-at auction),
        total-collateral-sold: (get total-collateral-sold auction),
        total-debt-raised: (get total-debt-raised auction),
        is-open: (get is-open auction)
      }
    )
    (map-set bids
      { auction-id: auction-id, lot-index: lot-index }
      {
        xusd: (get xusd last-bid),
        collateral-amount: (get collateral-amount last-bid),
        collateral-token: (get collateral-token auction),
        owner: (get owner last-bid),
        is-accepted: true
      }
    )
    (map-set winning-lots
      { user: (get owner last-bid) }
      {
        ids: (unwrap-panic (as-max-len? (append (get ids lots) (tuple (auction-id auction-id) (lot-index lot-index))) u100))
      }
    )
    (ok true)
  )
)

;; TODO: fix manual mocknet/testnet/mainnet switch
(define-private (get-owner)
  (if is-in-regtest
    (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0xd2454d24b49126f7f47c986b06960d7f5b70812359084197a200d691e67a002e)
      'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7 ;; Testnet only
      'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE ;; Other test environments
    )
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 ;; Mainnet (TODO)
  )
)
