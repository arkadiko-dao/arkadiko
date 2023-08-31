;; @contract ALEX Dual Yield - Mints DIKO for ALEX dual yield efforts
;; @version 1.1

;; Errors
(define-constant ERR-NOT-AUTHORIZED u32401)
(define-constant ERR-NOT-ACTIVATED u320001)
(define-constant ERR-TOO-MUCH-DIKO u320002)
(define-constant MAX-TO-MINT u1250000000000) ;; 1.25M DIKO

(define-data-var diko-minted uint u0)
(define-data-var rewards-per-cycle uint u12500000000) ;; 12.5K DIKO
(define-data-var shutdown-activated bool false)

(define-read-only (is-activated)
  (and
    (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
    (is-eq (var-get shutdown-activated) false)
  )
)

(define-read-only (get-rewards-per-cycle)
  (var-get rewards-per-cycle)
)

(define-read-only (get-diko-minted)
  (var-get diko-minted)
)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public methods (callable by ALEX contract or Arkadiko DAO) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts!
      (or
        (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address))
        (is-eq contract-caller 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.dual-farm-diko-helper)
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-activated) (err ERR-NOT-ACTIVATED))
    (asserts! (<= amount (var-get rewards-per-cycle)) (err ERR-TOO-MUCH-DIKO))

    (try! (as-contract (contract-call? .arkadiko-token transfer amount tx-sender recipient none)))
    (ok amount)
  )
)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public admin methods       ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (mint-diko (number-of-cycles uint))
  (let (
    (diko-to-mint (* number-of-cycles (var-get rewards-per-cycle)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-activated) (err ERR-NOT-ACTIVATED))
    (asserts! (<= (+ (var-get diko-minted) diko-to-mint) MAX-TO-MINT) (err ERR-TOO-MUCH-DIKO))

    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-to-mint (as-contract tx-sender)))
    (var-set diko-minted (+ (var-get diko-minted) diko-to-mint))
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
