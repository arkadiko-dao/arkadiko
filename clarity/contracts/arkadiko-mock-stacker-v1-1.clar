;; Stacker can initiate stacking for the STX reserve
;; The amount to stack is kept as a data var in the stx reserve
;; Stacks the STX tokens in POX
;; mainnet pox contract: SP000000000000000000002Q6VF78.pox
;; https://explorer.stacks.co/txid/0x41356e380d164c5233dd9388799a5508aae929ee1a7e6ea0c18f5359ce7b8c33?chain=mainnet
;; v1
;;  Stack for 1 cycle a time
;;  This way we miss each other cycle (i.e. we stack 1/2) but we can stack everyone's STX.
;;  We cannot stack continuously right now
;; v2
;;  Ideally we can stack more tokens on the same principal
;;  to stay eligible for future increases of reward slot thresholds.
;; random addr to use for hashbytes testing
;; 0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac
;; 0x00

(define-constant ERR-CANNOT-STACK u191)
(define-constant ERR-FAILED-STACK-STX u192)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u193)
(define-constant ERR-ALREADY-STACKING u194)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u195)

(define-data-var stacking-unlock-burn-height uint u0) ;; when is this cycle over
(define-data-var stacking-stx-stacked uint u0) ;; how many stx did we stack in this cycle
(define-data-var stacking-stx-received uint u0) ;; how many btc did we convert into STX tokens to add to vault collateral
(define-data-var payout-vault-id uint u0)
(define-data-var stacker-shutdown-activated bool false)

(define-data-var stacker-yield uint u9000) ;; 90%
(define-data-var governance-token-yield uint u500) ;; 5%
(define-data-var governance-reserve-yield uint u500) ;; 5%

(define-read-only (get-stacker-yield)
  (ok (var-get stacker-yield)) ;; stacker gets 80% of the yield
)

(define-read-only (get-governance-token-yield)
  (ok (var-get governance-token-yield)) ;; token holders get 10% of the yield
)

(define-read-only (get-governance-reserve-yield)
  (ok (var-get governance-reserve-yield)) ;; reserve gets 10% of the yield
)

(define-read-only (get-stacking-unlock-burn-height)
  (ok (var-get stacking-unlock-burn-height))
)

(define-read-only (get-stacking-stx-stacked)
  (ok (var-get stacking-stx-stacked))
)

(define-public (set-stacking-stx-received (stx-received uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (ok (var-set stacking-stx-received stx-received))
  )
)

(define-public (toggle-stacker-shutdown)
  (begin
    (ok (var-set stacker-shutdown-activated (not (var-get stacker-shutdown-activated))))
  )
)

(define-public (initiate-stacking (pox-addr (tuple (version (buff 1)) (hashbytes (buff 20))))
                                  (start-burn-ht uint)
                                  (lock-period uint))
  ;; 1. check `get-stacking-minimum` or `can-stack-stx` to see if we have > minimum tokens
  ;; 2. call `stack-stx` for 1 `lock-period` fixed
  (let (
    (tokens-to-stack (unwrap! (contract-call? .arkadiko-stx-reserve-v1-1 get-tokens-to-stack) (ok u0)))
    (can-stack (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox can-stack-stx pox-addr tokens-to-stack start-burn-ht lock-period)))
    (stx-balance (unwrap-panic (get-stx-balance)))
  )
    (asserts! (>= burn-block-height (var-get stacking-unlock-burn-height)) (err ERR-ALREADY-STACKING))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; check if we can stack - if not, then probably cause we have not reached the minimum with (var-get tokens-to-stack)
    (if (unwrap! can-stack (err ERR-CANNOT-STACK))
      (begin
        (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-stack (- tokens-to-stack stx-balance)))
        (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox stack-stx tokens-to-stack pox-addr start-burn-ht lock-period))
          result (begin
            (var-set stacking-unlock-burn-height (get unlock-burn-height result))
            (var-set stacking-stx-stacked (get lock-amount result))
            (ok (get lock-amount result))
          )
          error (begin
            (print error)
            (ok u200)
          )
        )
      )
      (err ERR-CANNOT-STACK)
    )
  )
)

;; can be called by the stx reserve to request STX tokens for withdrawal
(define-public (request-stx-for-withdrawal (ustx-amount uint))
  (ok true)
)

;; Pay all parties:
;; - Owner of vault
;; - DAO Reserve
;; - Owners of gov tokens
;; Unfortunately this cannot happen trustless
;; The bitcoin arrives at the bitcoin address passed to the initiate-stacking function
;; it is not possible to transact bitcoin txs from clarity right now
;; this means we will need to do this manually until some way exists to do this trustless (if ever?)
;; we pay out the yield in STX tokens
(define-public (payout (vault-id uint))
  (ok true)
)

(define-private (payout-liquidated-vault (vault-id uint))
  (ok true)
)

(define-private (payout-lot-bidder (lot-index uint))
  (ok true)
)

(define-private (calculate-vault-reward (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (basis-points (/ (* u10000 (get stacked-tokens vault)) (var-get stacking-stx-stacked))) ;; (100 * 100 * vault-stacked-tokens / stx-stacked)
  )
    (/ (* (var-get stacking-stx-received) basis-points) u10000)
  )
)

(define-private (payout-vault (vault-id uint))
  (ok true)
)

(define-read-only (get-stx-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)
