;; @contract ALEX Dual Yield - Mints DIKO for ALEX dual yield efforts
;; @version 1.1

;; Errors
(define-constant ERR-NOT-AUTHORIZED u32401)
(define-constant ERR-NOT-ACTIVATED u320001)

(define-data-var rewards-per-cycle uint u12500000000) ;; 12.5K DIKO
(define-data-var shutdown-activated bool false)

(define-read-only (is-activated)
  (and
    (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
    (is-eq (var-get shutdown-activated) false)
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public methods (callable by ALEX contract or Arkadiko DAO) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts!
      (or
        (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address))
        (is-eq tx-sender tx-sender) ;; TODO - allow ALEX contract to call this
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-activated) (err ERR-NOT-ACTIVATED))

    (try! (as-contract (contract-call? .arkadiko-token transfer amount tx-sender recipient none))) ;; TODO - add contract to DAO and update other emissions
    (ok amount)
  )
)



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public admin methods       ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (mint-diko (number-of-cycles uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-activated) (err ERR-NOT-ACTIVATED))

    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token (* number-of-cycles (var-get rewards-per-cycle)) (as-contract tx-sender)))
    (ok true)
  )
)

(define-public (update-rewards-per-cycle (rewards uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (var-set rewards-per-cycle rewards)
    (ok true)
  )
)

(define-public (toggle-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set shutdown-activated (not (var-get shutdown-activated))))
  )
)
