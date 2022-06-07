(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u222)

(define-data-var stacker-payer-shutdown-activated bool false)

(define-public (toggle-stacker-payer-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacker-payer-shutdown-activated (not (var-get stacker-payer-shutdown-activated))))
  )
)

(define-public (return-stx-to-reserve (ustx-amount uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-payer-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (if (> ustx-amount u0)
      (as-contract
        (stx-transfer? ustx-amount tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
      )
      (ok true)
    )
  )
)

(define-public (redeem-xstx (ustx-amount uint))
  (ok true)
)

