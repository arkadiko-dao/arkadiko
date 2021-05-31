;; DIKO Init - Foundation and founders
;;

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u22401))
(define-constant ERR-TOO-MANY-TOKENS-CLAIMED (err u221))

;; Constants
(define-constant BLOCKS-PER-MONTH u4320) ;; 144 * 30

(define-constant TOTAL-FOUNDATION u29000000000000) ;; 29m

(define-constant TOTAL-FOUNDERS u21000000000000) ;; 21m
(define-constant FOUNDERS-TOKENS-PER-MONTH u437500000000) ;; 437.500

;; Variables
(define-data-var contract-start-block uint block-height)

(define-data-var foundation-wallet principal tx-sender)
(define-data-var foundation-tokens-claimed uint u0) 

(define-data-var founders-wallet principal tx-sender)
(define-data-var founders-tokens-claimed uint u0) 

;; ---------------------------------------------------------
;; Foundation
;; ---------------------------------------------------------

;; Set foundation wallet to new address
(define-public (set-foundation-wallet (address principal))
  (let (
    (wallet (var-get foundation-wallet))
  )
    (asserts! (is-eq wallet tx-sender) ERR-NOT-AUTHORIZED)
    (var-set foundation-wallet address)
    (ok true)
  )
)

;; Get number of foundation tokens claimed already
(define-read-only (get-claimed-foundation-tokens)
  (var-get foundation-tokens-claimed)
)

;; Get amount of tokens foundation can claim
(define-read-only (get-pending-foundation-tokens)
  (let (
    (claimed-tokens (var-get foundation-tokens-claimed))
  )
    (ok (- TOTAL-FOUNDATION claimed-tokens)) 
  )
)

;; Claim tokens for foundation
(define-public (foundation-claim-tokens (amount uint))
  (let (
    (claimed-tokens (var-get foundation-tokens-claimed))
    (pending-tokens (unwrap! (get-pending-foundation-tokens) ERR-NOT-AUTHORIZED))
    (wallet (var-get foundation-wallet))
  )
    (asserts! (is-eq wallet tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (>= pending-tokens amount) ERR-TOO-MANY-TOKENS-CLAIMED)
    (var-set foundation-tokens-claimed (+ claimed-tokens amount))
    (contract-call? .arkadiko-token transfer amount .arkadiko-diko-init wallet none)
  )
)

;; ---------------------------------------------------------
;; Founders
;; ---------------------------------------------------------

;; Set founders wallet to new address
(define-public (set-founders-wallet (address principal))
  (let (
    (wallet (var-get founders-wallet))
  )
    (asserts! (is-eq wallet tx-sender) ERR-NOT-AUTHORIZED)
    (var-set founders-wallet address)
    (ok true)
  )
)

;; Get number of founders tokens claimed already
(define-read-only (get-claimed-founders-tokens)
  (var-get founders-tokens-claimed)
)

;; Get amount of tokens founders can claim
;; The founders are vested on 4 years, with a 6 months cliff.
;; Vesting happens monthly. 21m / 48 months = 437.500 per month
(define-read-only (get-pending-founders-tokens)
  (let (
    ;; Current month number after start
    (month-number (/ (- block-height (var-get contract-start-block)) BLOCKS-PER-MONTH))
    (claimed-tokens (var-get founders-tokens-claimed))
    (max-tokens-month (* month-number FOUNDERS-TOKENS-PER-MONTH))
  )
    ;; Vesting period
    (if (and (>= month-number u6) (<= month-number u47))
      (ok (- max-tokens-month claimed-tokens))
      (if (> month-number u47)
        ;; Vesting ended
        (ok (- TOTAL-FOUNDERS claimed-tokens)) 
        ;; Vesting did not start yet
        (ok u0)
      )
    )
  )
)

;; Claim tokens for founders
(define-public (founders-claim-tokens (amount uint))
  (let (
    (pending-tokens (unwrap! (get-pending-founders-tokens) ERR-NOT-AUTHORIZED))
    (claimed-tokens (var-get founders-tokens-claimed))
    (wallet (var-get founders-wallet))
  )
    (asserts! (is-eq wallet tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (>= pending-tokens amount) ERR-TOO-MANY-TOKENS-CLAIMED)
    (var-set founders-tokens-claimed (+ claimed-tokens amount))
    (contract-call? .arkadiko-token transfer amount .arkadiko-diko-init wallet none)
  )
)

;; ---------------------------------------------------------
;; Initialize
;; ---------------------------------------------------------

;; Initialize the contract
(begin
  (contract-call? .arkadiko-dao mint-token .arkadiko-token (+ TOTAL-FOUNDATION TOTAL-FOUNDERS) .arkadiko-diko-init)
)

