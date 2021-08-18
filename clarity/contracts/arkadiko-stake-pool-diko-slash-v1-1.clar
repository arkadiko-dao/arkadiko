;; @contract DIKO Pool Slashing - Example contract which can be deployed by governance
;; Able to withdraw 30% of DIKO from stake pool to foundation
;; @version 1.1

(define-constant ERR-ALREADY-EXECUTED u404)

(define-data-var is-executed bool false)

;; @desc execute slash
;; @post uint; returns amount of tokens withdrawn from DIKO pool
(define-public (execute)
  (begin
    (asserts! (is-eq (var-get is-executed) false) (err ERR-ALREADY-EXECUTED))
    (var-set is-executed true)

    ;; Execute slash for 30%
    (contract-call? .arkadiko-stake-pool-diko-v1-1 execute-slash u30)
  )
)
