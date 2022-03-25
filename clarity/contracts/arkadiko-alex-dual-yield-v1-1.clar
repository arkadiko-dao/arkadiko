;; @contract ALEX Dual Yield - Mints DIKO for ALEX dual yield efforts
;; @version 1.1

;; Errors
(define-constant ERR-NOT-AUTHORIZED u32401)

;; Basic emission percentage (5.5%)
(define-data-var rewards-percentage uint u55000)
(define-data-var shutdown-activated bool false)

(define-read-only (is-activated)
  (and
    (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
    (is-eq (var-get shutdown-activated) false)
  )
)

(define-read-only (get-rewards-per-block-for-alex)
  (let (
    (total-staking-rewards (contract-call? .arkadiko-diko-guardian-v1-1 get-staking-rewards-per-block))
    (pool-percentage (var-get rewards-percentage))
  )
    (if (is-activated)
      (/ (* total-staking-rewards pool-percentage) u1000000)
      u0
    )
  )
)



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public methods (callable by ALEX contract or Arkadiko DAO) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (mint (amount-of-blocks uint))
  (let (
    (pending-rewards (* amount-of-blocks (get-rewards-per-block-for-alex)))
  )
    (asserts!
      (or
        (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address))
        (is-eq tx-sender tx-sender) ;; TODO - allow ALEX contract to call this
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token pending-rewards tx-sender)) ;; TODO - add contract to DAO and update other emissions

    (ok pending-rewards)
  )
)



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public admin methods       ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (update-rewards-percentage (percentage uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (var-set rewards-percentage percentage)
    (ok true)
  )
)

(define-public (toggle-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set shutdown-activated (not (var-get shutdown-activated))))
  )
)
