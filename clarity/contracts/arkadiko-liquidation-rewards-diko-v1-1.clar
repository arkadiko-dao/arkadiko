
;; Errors
(define-constant ERR-NOT-AUTHORIZED u34401)
(define-constant ERR-EPOCH-NOT-ENDED u34002)

;; Constants
(define-constant blocks-per-epoch u2016) ;; 2 weeks

;; Variables
(define-data-var end-epoch-block uint (+ block-height blocks-per-epoch))

(define-read-only (get-end-epoch-block)
  (ok (var-get end-epoch-block))
)

;; ---------------------------------------------------------
;; Add rewards
;; ---------------------------------------------------------

;; @desc Amount of rewards that can be added
(define-read-only (get-rewards-to-add)
  (let (
    (total-block-rewards (contract-call? .arkadiko-diko-guardian-v1-1 get-staking-rewards-per-block))

    ;; 10% of staking rewards
    (rewards-to-add (/ (* total-block-rewards blocks-per-epoch) u100000))
  )
    (if (< block-height (var-get end-epoch-block))
      u0
      rewards-to-add
    )
  )
)

;; @desc add DIKO rewards to liquidation-rewards
(define-public (add-rewards)
  (let (
    (rewards-to-add (get-rewards-to-add))
    (start-block (- (var-get end-epoch-block) blocks-per-epoch))
  )
    (asserts! (>= block-height (var-get end-epoch-block)) (err ERR-EPOCH-NOT-ENDED))

    ;; Get DIKO token, add as rewards for epoch
    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token rewards-to-add (as-contract tx-sender)))
    (try! (contract-call? .arkadiko-liquidation-rewards-v1-1 add-reward start-block .arkadiko-token rewards-to-add))

    (var-set end-epoch-block (+ (var-get end-epoch-block) blocks-per-epoch))

    (ok rewards-to-add)
  )
)
