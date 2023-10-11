;; @contract Multihop Swap - Decentralised exchange
;; @version 1

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant ERR-SWAP-ONE-FAILED u7771)
(define-constant ERR-SWAP-TWO-FAILED u7772)

;; Swap X for Z with token Y in between
;; For instance, I want to swap STX to xBTC but there is no STX/xBTC pair
;; I swap STX to USDA and USDA to xBTC since there is a xBTC/USDA pair
(define-public (swap-x-for-z
  (token-x-trait <ft-trait>)
  (token-y-trait <ft-trait>)
  (token-z-trait <ft-trait>)
  (dx uint)
  (min-dz uint)
  (inverse-first bool)
  (inverse-second bool)
)
  (let (
    (swapped-amounts (if inverse-first
      (unwrap! (contract-call? .arkadiko-swap-v2-1 swap-y-for-x token-x-trait token-y-trait dx u0) (err ERR-SWAP-ONE-FAILED))
      (unwrap! (contract-call? .arkadiko-swap-v2-1 swap-x-for-y token-x-trait token-y-trait dx u0) (err ERR-SWAP-ONE-FAILED))
    ))
    (y-amount (if inverse-first
      (unwrap-panic (element-at swapped-amounts u0))
      (unwrap-panic (element-at swapped-amounts u1))
    ))
    (swapped-amounts-2 (if inverse-second
      (unwrap! (contract-call? .arkadiko-swap-v2-1 swap-y-for-x token-z-trait token-y-trait y-amount min-dz) (err ERR-SWAP-TWO-FAILED))
      (unwrap! (contract-call? .arkadiko-swap-v2-1 swap-x-for-y token-y-trait token-z-trait y-amount min-dz) (err ERR-SWAP-TWO-FAILED))
    ))
    (z-amount (if inverse-second
      (unwrap-panic (element-at swapped-amounts-2 u0))
      (unwrap-panic (element-at swapped-amounts-2 u1))
    ))
  )
    (ok swapped-amounts-2)
  )
)
