;; Implementation of Stacker Payer
;; which allows users to redeem xSTX for STX

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u222)
(define-constant ERR-WRONG-COLLATERAL-TOKEN u223)
(define-constant ERR-VAULT-LIQUIDATED u224)
(define-constant ERR-STILL-STACKING u225)

(define-data-var stacker-payer-shutdown-activated bool false)

(define-map unlocks { vault-id: uint } { unlocked-at-burn-height: uint })

(define-read-only (get-vault-unlock (vault-id uint))
  (default-to
    {
      unlocked-at-burn-height: u999999999999999
    }
    (map-get? unlocks { vault-id: vault-id })
  )
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

(define-public (redeem-stx (amount uint))
  (let (
    (sender tx-sender)
  )
    (asserts! (is-enabled) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (> amount u0) (ok u0))

    (try! (contract-call? .arkadiko-dao burn-token .xstx-token amount sender))
    (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-auto-payoff amount))
    (try! (as-contract (stx-transfer? amount tx-sender sender)))

    (ok amount)
  )
)

;; This method can be executed by anyone
;; after a stacking cycle ends to allow withdrawal of STX collateral
;; Only mark vaults that have revoked stacking and not been liquidated
;; must be called before a new `stack-extend` method call (stacking cycle)
(define-public (enable-vault-withdrawals (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (unlock (get-vault-unlock vault-id))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-payer-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq "STX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq false (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq true (get revoked-stacking vault)) (err ERR-STILL-STACKING))
    ;; A user indicates to unstack through the `toggle-stacking` method on freddie (revoked-stacking === true)
    ;; but then he should only be able to unstack if the burn height passed
    (asserts! (> burn-block-height (get unlocked-at-burn-height unlock)) (err ERR-BURN-HEIGHT-NOT-REACHED))

    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        stacked-tokens: u0,
        updated-at-block-height: block-height
      }))
    )
    (map-set unlocks { vault-id: vault-id } { unlocked-at-burn-height: u999999999999999 })

    (ok true)
  )
)

(define-public (initiate-unlock (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
  )
    (asserts! (is-eq true (get revoked-stacking vault)) (err ERR-STILL-STACKING))

    (map-set unlocks { vault-id: vault-id } { unlocked-at-burn-height: (unwrap-panic (contract-call? .arkadiko-stacker-v2-1 get-stacking-unlock-burn-height)) })
    (ok true)
  )
)
