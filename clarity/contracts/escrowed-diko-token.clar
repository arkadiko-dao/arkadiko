;; TOOD: update address
(impl-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

(define-fungible-token esdiko)

(define-constant ERR-NOT-AUTHORIZED u1401)

(define-data-var token-uri (string-utf8 256) u"")
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
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply esdiko))
)

(define-read-only (get-name)
  (ok "Escrowed Arkadiko Token")
)

(define-read-only (get-symbol)
  (ok "esDIKO")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance esdiko account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender .arkadiko-dao)
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    (asserts! (or (is-whitelisted sender) (is-whitelisted recipient)) (err ERR-NOT-AUTHORIZED))

    (match (ft-transfer? esdiko amount sender recipient)
      response (begin
        (print memo)
        (begin
          (try! (update-balance sender))
          (try! (update-balance recipient))
          (ok response)
        )
      )
      error (err error)
    )
  )
)

;; ---------------------------------------------------------
;; DAO token trait
;; ---------------------------------------------------------

;; Mint method for DAO
(define-public (mint-for-dao (amount uint) (recipient principal))
  (let (
    (result (ft-mint? esdiko amount recipient))
  )
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (try! (update-balance recipient))
    result
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (let (
    (result (ft-burn? esdiko amount sender))
  )
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (try! (update-balance sender))
    result
  )
)

;; Burn external
(define-public (burn (amount uint) (sender principal))
  (let (
    (result (ft-burn? esdiko amount sender))
  )
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    (try! (update-balance sender))
    result
  )
)

;; ---------------------------------------------------------
;; Vesting
;; ---------------------------------------------------------

;; Used by DIKO pool to signal a change in stake amount
;; When stake amount changes, vesting changes
(define-public (update-staking (staker principal) (amount uint))
  (begin
    (asserts! (is-whitelisted contract-caller) (err ERR-NOT-AUTHORIZED))
    (get-vested-diko staker amount)
  )
)

;; Used by this contract to signal a change in balance
;; When esDIKO balance, vesting changes
(define-private (update-balance (user principal))
  (get-vested-diko user (get stake-amount (get-vesting-of user)))
)

;; Helper method to get vested DIKO
(define-private (get-vested-diko (staker principal) (stake-amount uint))
  (let (
    (vested-diko (calculate-vested-diko staker))
  )
    (asserts! (> vested-diko u0) (ok u0))

    ;; Mint DIKO for user, burn esDIKO
    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token vested-diko staker))
    (try! (ft-burn? esdiko vested-diko staker))

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
    (esdiko-balance (unwrap-panic (get-balance staker)))
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

  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? esdiko u890000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
)
