(define-constant ERR-NOT-AUTHORIZED u120001)

(define-data-var req-staked-diko uint u250000) ;; 25% = 250000
(define-data-var stake-pool-diko principal .arkadiko-stake-pool-diko-v2-1)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map vesting 
  { user: principal } 
  {
    last-update-block: uint,
    stake-amount: uint,
    vesting-amount: uint,
    claimable: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-vesting-of (user principal))
  (default-to
    { last-update-block: u0, stake-amount: u0, vesting-amount: u0, claimable: u0 }
    (map-get? vesting { user: user })
  )
)

(define-read-only (get-req-staked-diko) 
  (var-get req-staked-diko)
)

(define-read-only (get-stake-pool-diko) 
  (var-get stake-pool-diko)
)

;; ---------------------------------------------------------
;; Start / end
;; ---------------------------------------------------------

;; @desc start esDIKO vesting
;; @param amount; amount to add to vesting
;; @post uint; returns amount of tokens staked
(define-public (start-vesting (amount uint))
  (let (
    (user tx-sender)
    (user-info (get-vesting-of user))
  )
    ;; Transfer esDIKO to contract
    (try! (contract-call? .escrowed-diko-token transfer amount user (as-contract tx-sender) none))

    ;; Update user vesting
    (unwrap-panic (update-user-vesting user (get stake-amount user-info) (+ (get vesting-amount user-info) amount)))

    (ok amount)
  )
)

;; @desc end esDIKO vesting
;; @param amount; amount to remove from vesting
;; @post uint; returns amount of tokens staked
(define-public (end-vesting (amount uint))
  (let (
    (user tx-sender)
    (user-info (get-vesting-of user))
  )
    ;; Transfer esDIKO to user
    (try! (contract-call? .escrowed-diko-token transfer amount (as-contract tx-sender) user none))

    ;; Update user vesting
    (unwrap-panic (update-user-vesting user (get stake-amount user-info) (+ (get vesting-amount user-info) amount)))

    (ok amount)
  )
)

;; ---------------------------------------------------------
;; Claim
;; ---------------------------------------------------------

;; @desc claim all vested DIKO
;; @post uint; returns amount of DIKO claimed
(define-public (claim-diko)
  (let (
    (user tx-sender)
    (vested-diko (get claimable (get-vesting-of user)))
  )
    ;; Mint DIKO for user, burn esDIKO
    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token vested-diko user))
    (try! (contract-call? .arkadiko-dao burn-token .escrowed-diko-token vested-diko user))
    
    (ok vested-diko)
  )
)

;; ---------------------------------------------------------
;; Vesting
;; ---------------------------------------------------------

;; Used by DIKO pool to signal a change in stake amount
;; When stake amount changes, vesting changes
(define-public (update-staking (user principal) (amount uint))
  (let (
    (user-info (get-vesting-of user))
  )
    (asserts! (is-eq (get-stake-pool-diko) contract-caller) (err ERR-NOT-AUTHORIZED))
    (update-user-vesting user amount (get vesting-amount user-info))
  )
)

;; Helper method to update user vesting info
(define-private (update-user-vesting (user principal) (stake-amount uint) (vesting-amount uint))
  (let (
    (vested-diko (calculate-vested-diko user))
    (current-claimable (get claimable (get-vesting-of user)))
  )
    (asserts! (> vested-diko u0) (ok false))

    ;; Update vesting info
    (map-set vesting { user: user } 
      { 
        last-update-block: block-height, 
        stake-amount: stake-amount, 
        vesting-amount: vesting-amount, 
        claimable: (+ current-claimable vested-diko) 
      }
    )
    (ok true)
  )
)

;; Calculate amount of esDIKO that is vested
;; esDIKO is linearly vesting over 1 year
(define-read-only (calculate-vested-diko (user principal)) 
  (let (
    (vesting-info (get-vesting-of user))
    (block-diff (- block-height (get last-update-block vesting-info)))
    (vesting-balance (get vesting-amount (get-vesting-of user)))
    (can-vest (* (/ u1000000 (var-get req-staked-diko)) (get stake-amount vesting-info)))
    (max-vest (if (> can-vest vesting-balance)
      vesting-balance
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

(define-public (set-stake-pooldiko (contract principal))
  (begin 
    (asserts! (is-eq tx-sender .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (var-set stake-pool-diko contract)
    (ok contract)
  )
)