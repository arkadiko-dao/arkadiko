;; Implementation of Stacker Payer
;; which allows users to redeem xSTX for STX

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-VAULT-ALREADY-REDEEMED u222)
(define-constant ERR-AUCTION-RUNNING u223)
(define-constant ERR-WRONG-COLLATERAL u224)
(define-constant ERR-NOT-LIQUIDATED u225)

(define-data-var stacker-payer-shutdown-activated bool false)
(define-data-var stx-redeemable uint u45650000000) ;; TODO: update for mainnet
(define-map vaults-redeemed { vault-id: uint } { redeemed: bool })

(define-read-only (get-stx-redeemable)
  (var-get stx-redeemable)
)

(define-read-only (has-stx-redeemable)
  (> (var-get stx-redeemable) u0)
)

(define-read-only (has-vault-redeemed (vault-id uint))
  (is-some (map-get? vaults-redeemed { vault-id: vault-id }))
)

(define-read-only (is-enabled)
  (and
    (not (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)))
    (not (var-get stacker-payer-shutdown-activated))
  )
)

(define-public (toggle-stacker-payer-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacker-payer-shutdown-activated (not (var-get stacker-payer-shutdown-activated))))
  )
)

(define-public (return-stx-to-reserve (ustx-amount uint))
  (begin
    (asserts! (is-enabled) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))

    (if (> ustx-amount u0)
      (as-contract
        (stx-transfer? ustx-amount tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
      )
      (ok true)
    )
  )
)

(define-public (set-stx-redeemable (ustx-amount uint))
  (let (
    (dao-address (contract-call? .arkadiko-dao get-dao-owner))
  )
    (asserts! (is-eq contract-caller dao-address) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stx-redeemable ustx-amount))
  )
)

(define-public (add-stx-redeemable (auction-id uint))
  (let (
    (auction (contract-call? .arkadiko-auction-engine-v4-2 get-auction-by-id auction-id))
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id (get vault-id auction)))
    (difference (if (> (get total-collateral-sold auction) (get stacked-tokens vault))
      (- (get total-collateral-sold auction) (get stacked-tokens vault))
      u0
    ))
  )
    (asserts! (not (has-vault-redeemed (get vault-id auction))) (err ERR-VAULT-ALREADY-REDEEMED))
    (asserts! (get auction-ended vault) (err ERR-AUCTION-RUNNING))
    (asserts! (get is-liquidated vault) (err ERR-NOT-LIQUIDATED))
    (asserts! (is-eq (get collateral-token vault) "xSTX") (err ERR-WRONG-COLLATERAL))

    (map-set vaults-redeemed { vault-id: (get vault-id auction) } { redeemed: true })
    (ok (var-set stx-redeemable (+ (var-get stx-redeemable) difference)))
  )
)

(define-public (redeem-stx (ustx-amount uint))
  (let (
    (sender tx-sender)
    (amount (min-of ustx-amount (var-get stx-redeemable)))
  )
    (asserts! (is-enabled) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (> amount u0) (ok true))

    (try! (contract-call? .arkadiko-dao burn-token .xstx-token amount sender))
    (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-auto-payoff amount))
    (try! (as-contract (stx-transfer? amount tx-sender sender)))

    (ok (var-set stx-redeemable (- (var-get stx-redeemable) amount)))
  )
)

(define-read-only (get-stx-redeemable-helper)
  (let (
    (freddie-redeemable (unwrap-panic (contract-call? .arkadiko-freddie-v1-1 get-stx-redeemable)))
  )
    (+ freddie-redeemable (var-get stx-redeemable))
  )
)

(define-public (redeem-stx-helper (ustx-amount uint))
  (let (
    (freddie-total-redeemable (unwrap-panic (contract-call? .arkadiko-freddie-v1-1 get-stx-redeemable)))
  )
    (try! (contract-call? .arkadiko-freddie-v1-1 redeem-stx ustx-amount))

    (if (> ustx-amount freddie-total-redeemable)
      (redeem-stx (- ustx-amount freddie-total-redeemable))
      (ok true)
    )
  )
)

(define-public (release-stacked-stx (auction-id uint))
  (let (
    (auction (contract-call? .arkadiko-auction-engine-v4-2 get-auction-by-id auction-id))
  )
    (try! (contract-call? .arkadiko-freddie-v1-1 release-stacked-stx (get vault-id auction)))
    (try! (add-stx-redeemable auction-id))

    (ok true)
  )
)

(define-private (min-of (i1 uint) (i2 uint))
  (if (< i1 i2)
      i1
      i2))


;; Initialization
(begin
  ;; TODO: update for mainnet
  (map-set vaults-redeemed { vault-id: u409 } { redeemed: true })
  (map-set vaults-redeemed { vault-id: u675 } { redeemed: true })
)
