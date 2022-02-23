
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u30401))

;; Constants

;; Variables
(define-data-var fragments-per-token uint u1000000000000)
(define-data-var total-fragments uint u0)

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

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-tokens-of (staker principal) (token principal))
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


;; ---------------------------------------------------------
;; Stake / unstake
;; ---------------------------------------------------------

(define-public (stake (amount uint))
  (let (
    (staker tx-sender)

    (user-fragments (get fragments (get-staker-fragments staker)))
    (add-user-fragments (* amount (var-get fragments-per-token)))
    (new-user-fragments (+ user-fragments add-user-fragments))
    (new-total-fragments (+ (var-get total-fragments) add-user-fragments))
  )
    ;; Transfer USDA
    (try! (contract-call? .usda-token transfer amount staker (as-contract tx-sender) none))

    ;; Update user tokens
    (map-set staker-fragments  { staker: staker } { fragments: new-user-fragments })

    ;; Update total fragments
    (var-set total-fragments new-total-fragments)

    (ok amount)
  )
)

(define-public (unstake (amount uint))
  (let (
    (staker tx-sender)

    (user-fragments (get fragments (get-staker-fragments staker)))
    (remove-user-fragments (* amount (var-get fragments-per-token)))
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


;; ---------------------------------------------------------
;; Withdraw
;; ---------------------------------------------------------

(define-public (withdraw (amount uint))
  (let (
    (sender tx-sender)

    (usda-balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
    (new-usda-balance (- usda-balance amount))
    (new-fragments-per-token (/ (var-get total-fragments) new-usda-balance))
  )
    ;; Transfer token
    (try! (as-contract (contract-call? .usda-token transfer amount (as-contract tx-sender) sender none)))

    ;; Update fragments-per-token
    (var-set fragments-per-token new-fragments-per-token)

    (ok amount)
  )
)
