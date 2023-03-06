;; Implementation of Stacker Payer
;; which allows users to redeem xSTX for STX

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)

(define-data-var stacker-payer-shutdown-activated bool false)

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
