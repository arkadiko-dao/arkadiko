(define-constant ERR-NOT-AUTHORIZED u120001)

(define-data-var req-staked-diko uint u250000) ;; 25% = 250000

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map vesting 
  { staker: principal } 
  {
    last-update-block: uint,
    stake-amount: uint
  }
)

(define-map whitelist principal bool)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-vesting-of (staker principal))
  (default-to
    { last-update-block: u0, stake-amount: u0 }
    (map-get? vesting { staker: staker })
  )
)

(define-read-only (get-req-staked-diko) 
  (var-get req-staked-diko)
)

(define-read-only (is-whitelisted (contract principal)) 
  (default-to
    false
    (map-get? whitelist contract)
  )
)

;; ---------------------------------------------------------
;; Stake / unstake
;; ---------------------------------------------------------

;; TODO: user should be able to stake/unstake to vest esDIKO

;; ---------------------------------------------------------
;; Vesting
;; ---------------------------------------------------------

;; Used by DIKO pool to signal a change in stake amount
;; When stake amount changes, vesting changes
(define-public (update-staking (staker principal) (amount uint))
  (begin
    ;; TODO: change whitelisted list to principal (arkadiko-stake-pool-diko-v2-1)
    (asserts! (is-whitelisted contract-caller) (err ERR-NOT-AUTHORIZED))
    (get-vested-diko staker amount)
  )
)

;; Helper method to get vested DIKO
(define-private (get-vested-diko (staker principal) (stake-amount uint))
  (let (
    (vested-diko (calculate-vested-diko staker))
  )
    (asserts! (> vested-diko u0) (ok u0))

    ;; Mint DIKO for user, burn esDIKO
    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token vested-diko staker))
    (try! (contract-call? .arkadiko-dao burn-token .escrowed-diko-token vested-diko staker))

    ;; Update vesting info
    (map-set vesting { staker: staker } { last-update-block: block-height, stake-amount: stake-amount })
    (ok vested-diko)
  )
)

;; Calculate amount of esDIKO that is vested
;; esDIKO is linearly vesting over 1 year
(define-read-only (calculate-vested-diko (staker principal)) 
  (let (
    (vesting-info (get-vesting-of staker))
    (block-diff (- block-height (get last-update-block vesting-info)))
    (esdiko-balance (unwrap-panic (contract-call? .escrowed-diko-token get-balance staker)))
    (can-vest (* (/ u1000000 (var-get req-staked-diko)) (get stake-amount vesting-info)))
    (max-vest (if (> can-vest esdiko-balance)
      esdiko-balance
      can-vest
    ))
    (vest-per-block (/ (* max-vest u1000000) (* u144 u365)))
  )
    (/ (* block-diff vest-per-block) u1000000)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-req-staked-diko (value uint))
  (begin 
    (asserts! (is-eq tx-sender .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (var-set req-staked-diko value)
    (ok value)
  )
)

(define-public (set-whitelist (contract principal) (enabled bool))
  (begin 
    (asserts! (is-eq tx-sender .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (map-set whitelist contract enabled)
    (ok enabled)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  (map-set whitelist .arkadiko-stake-pool-diko-v2-1 true)
)
