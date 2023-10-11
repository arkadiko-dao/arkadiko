(impl-trait .arkadiko-liquidation-pool-trait-v1.liquidation-pool-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED u32401)
(define-constant ERR-UNSTAKE-AMOUNT-EXCEEDED u32002)
(define-constant ERR-WITHDRAWAL-AMOUNT-EXCEEDED u32003)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u32004)
(define-constant ERR-STAKE-NOT-UNLOCKED u32005)

;; Variables
(define-data-var fragments-per-token uint u1000000000000)
(define-data-var total-fragments uint u0)
(define-data-var shutdown-activated bool false)
(define-data-var lockup-blocks uint u4320)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map staker-fragments 
  { 
    staker: principal,
  } 
  {
    fragments: uint
  }
)

(define-read-only (get-staker-fragments (staker principal))
  (default-to
    { fragments: u0 }
    (map-get? staker-fragments { staker: staker })
  )
)

(define-map staker-lockup 
  { 
    staker: principal,
  } 
  {
    start-block: uint
  }
)

(define-read-only (get-staker-lockup (staker principal))
  (default-to
    { start-block: u0 }
    (map-get? staker-lockup { staker: staker })
  )
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
;; Getters
;; ---------------------------------------------------------

;; @desc get current lockup time
(define-read-only (get-lockup-blocks)
  (ok (var-get lockup-blocks))
)

;; @desc get current total fragments
(define-read-only (get-total-fragments)
  (ok (var-get total-fragments))
)

;; @desc get current fragments per token
(define-read-only (get-fragments-per-token)
  (ok (var-get fragments-per-token))
)

;; @desc get tokens of given staker
;; @param staker; the staker to get tokens of
(define-read-only (get-tokens-of (staker principal))
  (let (
    (per-token (var-get fragments-per-token))
  )
    (if (is-eq per-token u0)
      (ok u0)
      (let (
        (user-fragments (get fragments (get-staker-fragments staker)))
      )
        (ok (/ user-fragments per-token))
      )
    )
  )
)

;; @desc get share % of user at given block
;; @param user; the user to get share of
;; @param block; block on which shares are calculated
(define-read-only (get-shares-at (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    (user-fragments (get fragments (at-block block-hash (get-staker-fragments user))))
    (fragments-total (unwrap-panic (at-block block-hash (get-total-fragments))))
  )
    (if (is-eq fragments-total u0)
      (ok u0)
      (ok (/ (* user-fragments u10000000) fragments-total))
    )
  )
)

;; ---------------------------------------------------------
;; Stake / unstake
;; ---------------------------------------------------------

;; @desc stake USDA in pool
;; @param amount; amount to stake
(define-public (stake (amount uint))
  (let (
    (staker tx-sender)

    (user-fragments (get fragments (get-staker-fragments staker)))
    (add-user-fragments (* amount (var-get fragments-per-token)))
    (new-user-fragments (+ user-fragments add-user-fragments))
    (new-total-fragments (+ (var-get total-fragments) add-user-fragments))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))

    ;; Transfer USDA
    (try! (contract-call? .usda-token transfer amount staker (as-contract tx-sender) none))

    ;; Update user tokens
    (map-set staker-fragments  { staker: staker } { fragments: new-user-fragments })

    ;; Update lockup
    (map-set staker-lockup  { staker: staker } { start-block: block-height })

    ;; Update total fragments
    (var-set total-fragments new-total-fragments)

    (ok amount)
  )
)

;; @desc unstake USDA from pool
;; @param amount; amount to unstake
(define-public (unstake (amount uint))
  (let (
    (staker tx-sender)

    (stake-start-block (get start-block (get-staker-lockup staker)))
    (user-fragments (get fragments (get-staker-fragments staker)))
    (remove-user-fragments (* amount (var-get fragments-per-token)))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (>= user-fragments remove-user-fragments) (err ERR-UNSTAKE-AMOUNT-EXCEEDED))
    (asserts! (>= block-height (+ stake-start-block (var-get lockup-blocks))) (err ERR-STAKE-NOT-UNLOCKED))

    (let (
      (new-user-fragments (- user-fragments remove-user-fragments))
      (new-total-fragments (- (var-get total-fragments) remove-user-fragments))
    )
      ;; Transfer USDA
      (try! (as-contract (contract-call? .usda-token transfer amount (as-contract tx-sender) staker none)))

      ;; Update user tokens
      (map-set staker-fragments  { staker: staker } { fragments: new-user-fragments })

      ;; Update total fragments
      (var-set total-fragments new-total-fragments)

      (ok amount)
    )
  )
)


;; ---------------------------------------------------------
;; Withdraw
;; ---------------------------------------------------------

;; @desc max amount of USDA that can be withdrawn for liquidations
(define-read-only (max-withdrawable-usda)
  (let (
    (usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    (usda-to-keep u1000000000) ;; always keep 1k USDA
  )
    (if (<= usda-balance usda-to-keep)
      (ok u0)
      (ok (- usda-balance usda-to-keep))
    )
  )
)

;; @desc withdraw USDA for liquidations (only for auction-engine)
;; @param amount; amount to withdraw
(define-public (withdraw (amount uint))
  (let (
    (sender tx-sender)

    (usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    (new-usda-balance (- usda-balance amount))
    (new-fragments-per-token (/ (var-get total-fragments) new-usda-balance))
  )
    (asserts! (is-eq tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "auction-engine"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= amount (unwrap-panic (max-withdrawable-usda))) (err ERR-WITHDRAWAL-AMOUNT-EXCEEDED))

    ;; Transfer token
    (try! (as-contract (contract-call? .usda-token transfer amount (as-contract tx-sender) sender none)))

    ;; Update fragments-per-token
    (var-set fragments-per-token new-fragments-per-token)

    (ok amount)
  )
)

;; ---------------------------------------------------------
;; Update
;; ---------------------------------------------------------

(define-public (update-lockup (blocks uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set lockup-blocks blocks)
    
    (ok true)
  )
)
