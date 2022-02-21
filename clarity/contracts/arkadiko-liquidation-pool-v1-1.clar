
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u30401))

;; Constants

;; Variables

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map token-fragments 
  { 
    token: principal 
  } 
  {
    last-updated-block: uint,
    total-fragments: uint,
    fragments-per-token: uint
  }
)

(define-read-only (get-token-fragments (token principal))
  (default-to
    { last-updated-block: u0, total-fragments: u0, fragments-per-token: u100000000 }
    (map-get? token-fragments { token: token })
  )
)

;; 
(define-map staker-fragments 
  { 
    staker: principal,
    token: principal 
  } 
  {
    fragments: uint
  }
)

(define-read-only (get-fragments-of (staker principal) (token principal))
  (let (
    (current-fragments (get-fragments-of-helper staker token))
  )
    (if (is-eq current-fragments u0)
      (let (
        (last-updated-block (get last-updated-block (get-token-fragments token)))
        (block-hash (unwrap-panic (get-block-info? id-header-hash last-updated-block)))
        (usda-fragments (at-block block-hash (get-fragments-of-helper staker .usda-token)))
      )
        usda-fragments
      )
      current-fragments
    )
  )
)

(define-read-only (get-fragments-of-helper (staker principal) (token principal))
  (default-to
    u0
    (get fragments (map-get? staker-fragments { staker: staker, token: token }))
  )
)

(define-read-only (get-tokens-of (staker principal) (token principal))
  (let (
    (token-info (unwrap-panic (map-get? token-fragments { token: token })))
    (per-token (get fragments-per-token token-info))
    (user-fragments (get-fragments-of staker token))
  )
    (ok (/ user-fragments per-token))
  )
)

;; ---------------------------------------------------------
;; Stake / unstake
;; ---------------------------------------------------------

(define-public (stake (amount uint))
  (let (
    (staker tx-sender)
    (token-info (get-token-fragments .usda-token))

    (user-fragments (get-fragments-of staker .usda-token))
    (add-user-fragments (* amount (get fragments-per-token token-info)))
    (new-user-fragments (+ user-fragments add-user-fragments))
    (new-total-fragments (+ (get total-fragments token-info) add-user-fragments))
  )
    ;; Transfer USDA
    (try! (contract-call? .usda-token transfer amount staker (as-contract tx-sender) none))

    ;; Update user tokens
    (map-set staker-fragments  { staker: staker, token: .usda-token } { fragments: new-user-fragments })

    ;; Update total fragments
    (map-set token-fragments { token: .usda-token } (merge token-info { total-fragments: new-total-fragments }))

    (ok amount)
  )
)

(define-public (unstake (amount uint) (token <ft-trait>))
  (let (
    (staker tx-sender)
    (token-info (get-token-fragments (contract-of token)))

    (user-fragments (get-fragments-of staker (contract-of token)))
    (remove-user-fragments (* amount (get fragments-per-token token-info)))
    (new-user-fragments (- user-fragments remove-user-fragments))
    (new-total-fragments (- (get total-fragments token-info) remove-user-fragments))
  )
    ;; Transfer token
    (try! (as-contract (contract-call? token transfer amount (as-contract tx-sender) staker none)))

    ;; Update user tokens
    (map-set staker-fragments  { staker: staker, token: .usda-token } { fragments: new-user-fragments })

    ;; Update total fragments
    (map-set token-fragments { token: .usda-token } (merge token-info { total-fragments: new-total-fragments }))

    (ok amount)
  )
)

;; ---------------------------------------------------------
;; Deposit / withdraw
;; ---------------------------------------------------------

(define-public (deposit (amount uint) (token <ft-trait>))
  (let (
    (token-info (get-token-fragments (contract-of token)))
    (token-balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))

    (block-hash (unwrap-panic (get-block-info? id-header-hash (- block-height u1))))
    (usda-info (at-block block-hash (get-token-fragments .usda-token)))

    (new-token-balance (+ token-balance amount))
    (new-fragments-per-token (/ (get total-fragments usda-info) new-token-balance))
  )
    ;; TODO - only for liquidation-fund
    
    ;; Transfer token
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))

    ;; Update fragments-per-token
    (map-set token-fragments { token: (contract-of token) } { 
      last-updated-block: (- block-height u1),
      total-fragments: (get total-fragments usda-info),
      fragments-per-token: new-fragments-per-token,
    })

    (ok amount)
  )
)

(define-public (withdraw (amount uint) (token <ft-trait>))
  (let (
    (sender tx-sender)
    (token-info (get-token-fragments (contract-of token)))
    (token-balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
    (new-token-balance (- token-balance amount))
    (new-fragments-per-token (/ (get total-fragments token-info) new-token-balance))
  )

    ;; TODO - only for liquidation-fund

    ;; Transfer token
    (try! (as-contract (contract-call? token transfer amount (as-contract tx-sender) sender none)))

    ;; Update fragments-per-token
    (map-set token-fragments { token: (contract-of token) } (merge token-info { fragments-per-token: new-fragments-per-token }))

    (ok amount)
  )
)
