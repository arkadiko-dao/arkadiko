;; Errors
(define-constant ERR-NOT-AUTHORIZED u18401)
(define-constant ERR-ALREADY-RAN u18001)
(define-constant AMOUNT u3557678000000)

;; Variables
(define-data-var ran-fix bool false)

;; Fix ratio in pool
(define-public (fix)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (var-get ran-fix)) (err ERR-ALREADY-RAN))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .arkadiko-token AMOUNT .arkadiko-stake-pool-diko-v1-4)))
    (var-set ran-fix true)
    (ok true)
  )
)
