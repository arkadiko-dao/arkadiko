;; @contract Bitflow <> Arkadiko - Mints DIKO for USDA <> USDC stable swap
;; @version 1.1

;; Errors
(define-constant ERR-NOT-AUTHORIZED u32401)
(define-constant ERR-NOT-ACTIVATED u320001)
(define-constant ERR-TOO-MUCH-DIKO u320002)
(define-constant TOTAL-DIKO u919125000000) ;; Max ~900K DIKO over the next 18 months (April 2024 -> End of 2025)

(define-data-var diko-minted uint u0)
(define-data-var rewards-per-cycle uint u1650000000) ;; ~1650 DIKO per 144 blocks (1 cycle on Bitflow)
(define-data-var shutdown-activated bool false)
(define-data-var pool-percentage uint u100)

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

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; public methods (callable by Arkadiko DAO)          ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (send (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-activated) (err ERR-NOT-ACTIVATED))

    (try! (as-contract (contract-call? .arkadiko-token transfer amount tx-sender recipient none)))
    (ok amount)
  )
)

(define-public (mint-diko (number-of-cycles uint))
  (let (
    (diko-to-mint (* number-of-cycles (var-get rewards-per-cycle)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-activated) (err ERR-NOT-ACTIVATED))
    (asserts! (<= (+ (var-get diko-minted) diko-to-mint) TOTAL-DIKO) (err ERR-TOO-MUCH-DIKO))

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
