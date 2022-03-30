(use-trait liquidation-rewards-trait .arkadiko-liquidation-rewards-trait-v1.liquidation-rewards-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED u34401)
(define-constant ERR-EPOCH-NOT-ENDED u34002)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u34003)

;; Variables
;; TODO - SET FOR MAINNET
;; TODO - UPDATE REWARDS FOR STAKING POOLS
(define-data-var end-epoch-block uint (+ block-height u720)) ;; 5 days after deploy
(define-data-var epoch-rate uint u100000) ;; 10%
(define-data-var blocks-per-epoch uint u720) ;; 5 days
(define-data-var shutdown-activated bool false)

(define-read-only (get-end-epoch-block)
  (ok (var-get end-epoch-block))
)

(define-read-only (get-epoch-rate)
  (ok (var-get epoch-rate))
)

(define-read-only (get-blocks-per-epoch)
  (ok (var-get blocks-per-epoch))
)

(define-read-only (get-epoch-info)
  (ok {
    blocks: (var-get blocks-per-epoch),
    rate: (var-get epoch-rate),
    end-block: (var-get end-epoch-block)
  })
)

(define-read-only (get-shutdown-activated)
  (or
    (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated))
    (var-get shutdown-activated)
  )
)

;; @desc toggles the killswitch
(define-public (toggle-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set shutdown-activated (not (var-get shutdown-activated))))
  )
)

;; ---------------------------------------------------------
;; Add rewards
;; ---------------------------------------------------------

;; @desc Amount of rewards that can be added
(define-read-only (get-rewards-to-add)
  (let (
    (total-block-rewards (contract-call? .arkadiko-diko-guardian-v1-1 get-staking-rewards-per-block))
    (rewards-to-add (/ (* total-block-rewards (var-get blocks-per-epoch) (var-get epoch-rate)) u1000000))
  )
    rewards-to-add
  )
)

;; @desc add DIKO rewards to liquidation-rewards
(define-public (add-rewards (liquidation-rewards <liquidation-rewards-trait>))
  (let (
    (rewards-to-add (get-rewards-to-add))
    (start-block (- (var-get end-epoch-block) (var-get blocks-per-epoch)))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of liquidation-rewards) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidation-rewards"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= block-height (var-get end-epoch-block)) (err ERR-EPOCH-NOT-ENDED))

    ;; Get DIKO token, add as rewards for epoch
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .arkadiko-token rewards-to-add (as-contract tx-sender))))
    (try! (as-contract (contract-call? liquidation-rewards add-reward start-block false .arkadiko-token rewards-to-add)))

    (var-set end-epoch-block (+ (var-get end-epoch-block) (var-get blocks-per-epoch)))

    (ok rewards-to-add)
  )
)

;; ---------------------------------------------------------
;; Update
;; ---------------------------------------------------------

(define-public (update-epoch-data (rate uint) (length uint) (end-block uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set epoch-rate rate)
    (var-set blocks-per-epoch length)
    (var-set end-epoch-block end-block)
    
    (ok true)
  )
)

