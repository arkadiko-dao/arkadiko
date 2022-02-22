
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u30401))

;; Constants

;; Variables
(define-data-var total-staker-token-base uint u0) ;; TODO - per token

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map token-fragments 
  { 
    token: principal 
  } 
  {
    total-fragments: uint,
    fragments-per-token: uint
  }
)

;; 
(define-map staker-fragments 
  { 
    staker: principal,
  } 
  {
    fragments: uint
  }
)

(define-map staker-token-base 
  { 
    staker: principal,
    token: principal
  } 
  {
    base: uint
  }
)

(define-read-only (get-token-fragments (token principal))
  (default-to
    { total-fragments: u0, fragments-per-token: u100000000000 }
    (map-get? token-fragments { token: token })
  )
)

(define-read-only (get-staker-fragments (staker principal))
  (default-to
    { fragments: u0 }
    (map-get? staker-fragments { staker: staker })
  )
)

(define-read-only (get-staker-token-base (staker principal) (token principal))
  (default-to
    { base: u0 }
    (map-get? staker-token-base { staker: staker, token: token })
  )
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-tokens-of (staker principal) (token principal))
  (let (
    (per-token (get fragments-per-token (get-token-fragments token)))
  )
    (if (is-eq per-token u0)
      (ok u0)
      (let (
        (staker-base (get base (get-staker-token-base staker token)))
        (user-fragments (get fragments (get-staker-fragments staker)))
        (total-staker (/ user-fragments per-token))
      )
        (if (< total-staker staker-base)
          (ok u0)
          (ok (- total-staker staker-base))
        )
      )
    )
  )
)

(define-read-only (get-fragments-of (staker principal))
  (ok (get fragments (get-staker-fragments staker)))
)

;; ---------------------------------------------------------
;; Stake / unstake
;; ---------------------------------------------------------

(define-public (stake (amount uint))
  (let (
    (staker tx-sender)
    (token-info (get-token-fragments .usda-token))

    (user-fragments (unwrap-panic (get-fragments-of staker)))
    (add-user-fragments (* amount (get fragments-per-token token-info)))
    (new-user-fragments (+ user-fragments add-user-fragments))
    (new-total-fragments (+ (get total-fragments token-info) add-user-fragments))
  )
    ;; Transfer USDA
    (try! (contract-call? .usda-token transfer amount staker (as-contract tx-sender) none))

    ;; Update user tokens
    (map-set staker-fragments  { staker: staker } { fragments: new-user-fragments })

    ;; Update total fragments
    (map-set token-fragments { token: .usda-token } (merge token-info { total-fragments: new-total-fragments }))

    ;; TODO - in separate contract
    (unwrap-panic (register-for-token amount .arkadiko-token))

    (ok amount)
  )
)

;; TODO: default to block when token added??
(define-public (register-for-token (usda-amount uint) (token <ft-trait>))
  (let (
    (staker tx-sender)

    (per-usda (get fragments-per-token (get-token-fragments .usda-token)))
    (per-token (get fragments-per-token (get-token-fragments (contract-of token))))
    (total-fragments (get total-fragments (get-token-fragments (contract-of token))))

    (add-user-fragments (* usda-amount per-usda))
    (add-user-base (/ add-user-fragments per-token))
    (user-base (get base (get-staker-token-base staker (contract-of token))))
    (new-base (+ user-base add-user-base))
  )

    (if (is-eq total-fragments u0)
      (ok u0)
      (begin
        (var-set total-staker-token-base (+ (var-get total-staker-token-base) add-user-base))

        (map-set staker-token-base { staker: staker, token: (contract-of token) } { base: new-base })

        (ok new-base)
      )
    )

  )
)

(define-public (unstake (amount uint) (token <ft-trait>))
  (let (
    (staker tx-sender)
    (token-info (get-token-fragments (contract-of token)))

    (user-fragments (unwrap-panic (get-fragments-of staker)))
    (remove-user-fragments (* amount (get fragments-per-token token-info)))
    (new-user-fragments (- user-fragments remove-user-fragments))
    (new-total-fragments (- (get total-fragments token-info) remove-user-fragments))

    (token-balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
  )

    ;; TODO - Move to separate contract
    (try! (unstake-token remove-user-fragments .arkadiko-token))


    ;; Transfer token
    (try! (as-contract (contract-call? token transfer amount (as-contract tx-sender) staker none)))

    ;; Update user tokens
    (map-set staker-fragments  { staker: staker } { fragments: new-user-fragments })

    ;; Update total fragments
    (map-set token-fragments { token: .usda-token } (merge token-info { total-fragments: new-total-fragments }))

    (ok amount)
  )
)



(define-public (unstake-token (fragments uint) (token <ft-trait>))

  (let (
    (staker tx-sender)

    (user-fragments (unwrap-panic (get-fragments-of staker)))
    (user-tokens (unwrap-panic (get-tokens-of staker (contract-of token))))
    (ratio (/ (* fragments u10000000000) user-fragments))
    (amount (/ (* user-tokens ratio) u10000000000))

    (user-fragments-left (- user-fragments fragments))
    (user-tokens-left (- user-tokens amount))

    (per-token (get fragments-per-token (get-token-fragments (contract-of token))))
    (user-base (get base (get-staker-token-base staker (contract-of token))))

    (new-base (- (/ user-fragments-left per-token) user-tokens-left))
    (remove-base (- user-base new-base))

    (total-fragments (get total-fragments (get-token-fragments (contract-of token))))
    (token-balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
  )

    (if (is-eq total-fragments u0)
      (ok true)
      (let (
        (new-total-fragments (- total-fragments fragments))

        (new-fragments-per-tokens
          (if (is-eq token-balance amount)
            u100000000000
            (/ new-total-fragments (- token-balance amount))
          )
        )

      )
        (var-set total-staker-token-base (+ (var-get total-staker-token-base) remove-base))

        (map-set staker-token-base   { staker: staker, token: (contract-of token) } { base: new-base })

        ;; Transfer token
        (if (is-eq amount u0)
          (ok true)
          (as-contract (contract-call? token transfer amount (as-contract tx-sender) staker none))
        )
      )
    )
  )
)



(define-public (claim-token (token <ft-trait>))

  (let (
    (staker tx-sender)

    (add-base (unwrap-panic (get-tokens-of staker (contract-of token))))
    (user-base (get base (get-staker-token-base staker (contract-of token))))
    (new-base (+ user-base add-base))
  )
    (if (is-eq add-base u0)
      (ok false)
      (begin
        (var-set total-staker-token-base (+ (var-get total-staker-token-base) add-base))

        (map-set staker-token-base   { staker: staker, token: (contract-of token) } { base: new-base })

        ;; Transfer token
        (as-contract (contract-call? token transfer add-base (as-contract tx-sender) staker none))
      )
    )
  )
)


;; ---------------------------------------------------------
;; Deposit / withdraw
;; ---------------------------------------------------------

(define-public (deposit (amount uint) (token <ft-trait>))
  (let (
    (token-info (get-token-fragments (contract-of token)))
    (usda-info (get-token-fragments .usda-token))

    (token-balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
    (new-token-balance (+ token-balance amount (var-get total-staker-token-base)))

    (new-fragments-per-token (/ (get total-fragments usda-info) new-token-balance))
  )
    ;; TODO - only for liquidation-fund
    
    ;; Transfer token
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))

    ;; Update fragments-per-token
    (map-set token-fragments { token: (contract-of token) } { 
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
