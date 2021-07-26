;; DIKO pool slashing
;; Example contract which can be deployed by governance
;; Able to withdraw 30% of DIKO from stake pool to foundation

(define-constant ERR-ALREADY-EXECUTED u404)

(define-data-var is-executed bool false)

(define-public (execute)
  (begin
    (asserts! (is-eq (var-get is-executed) false) (err ERR-ALREADY-EXECUTED))
    (var-set is-executed true)

    ;; Execute slash for 30%
    (contract-call? .arkadiko-stake-pool-diko-v1-1 execute-slash u30)
  )
)
