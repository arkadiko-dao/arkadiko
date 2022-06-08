;; Implementation of Stacker Payer
;; which allows users to redeem xSTX for STX

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-VAULT-ALREADY-REDEEMED u222)
(define-constant ERR-AUCTION-RUNNING u223)
(define-constant ERR-WRONG-COLLATERAL u224)

(define-data-var stacker-payer-shutdown-activated bool false)
(define-data-var stx-redeemable uint u0)
(define-map vaults-redeemed { vault-id: uint } { redeemed: bool })

(define-read-only (get-stx-redeemable)
  (var-get stx-redeemable)
)

(define-read-only (has-stx-redeemable)
  (> (var-get stx-redeemable) u0)
)

(define-read-only (has-vault-redeemed (vault-id uint))
  (is-some (map-get? vaults-redeemed vault-id))
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

(define-public (add-stx-redeemable (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (stx-redeemable (var-get stx-redeemable))
    (difference (- (get collateral vault) (get stacked-tokens vault)))
  )
    (asserts! (not (has-vault-redeemed)) (err ERR-VAULT-ALREADY-REDEEMED))
    (asserts! (get auction-ended vault) (err ERR-AUCTION-RUNNING))
    (asserts! (is-eq (get collateral-token vault) "xSTX") (err ERR-WRONG-COLLATERAL))

    (map-set vaults-redeemed { vault-id: vault-id } { redeemed: true })
    (ok (var-set stx-redeemable (+ stx-redeemable difference)))
  )
)

(define-public (redeem-stx (ustx-amount uint))
  (let (
    (sender tx-sender)
    (amount (min-of ustx-amount (var-get stx-redeemable)))
  )
    (asserts! (is-enabled) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))

    (try! (contract-call? .arkadiko-dao burn-token .xstx-token amount sender))
    (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-auto-payoff amount))
    (try! (as-contract (stx-transfer? amount tx-sender sender)))

    (ok true)
  )
)

(define-private (min-of (i1 uint) (i2 uint))
  (if (< i1 i2)
      i1
      i2))
