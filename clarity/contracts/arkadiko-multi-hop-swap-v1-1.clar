;; @contract Multihop Swap - Decentralised exchange
;; @version 1

(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-constant ERR-TOO-MUCH-SLIPPAGE u71)

;; Swap X for Z with token Y in between
;; For instance, I want to swap STX to xBTC but there is no STX/xBTC pair
;; I swap STX to USDA and USDA to xBTC since there is a xBTC/USDA pair
(define-public (swap-x-for-z (token-x-trait <ft-trait>) (token-y-trait <ft-trait>) (token-y-trait <ft-trait>) (dx uint) (min-dz uint))
  (let (
    (swapped-amount (contract-call? .arkadiko-swap-v2-1 swap-x-for-y token-x-trait token-y-trait dx u0))
    (y-amount (unwrap-panic (element-at swapped-amounts u1)))
    (swapped-amount-2 (contract-call? .arkadiko-swap-v2-1 swap-x-for-y token-y-trait token-z-trait dx min-dz))
    (z-amount (unwrap-panic (element-at swapped-amounts-2 u1)))
  )
    (asserts! (< min-dz z-amount) (err ERR-TOO-MUCH-SLIPPAGE))
    (ok true)
  )
)
