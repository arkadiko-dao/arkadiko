;; Stacker can initiate stacking for the STX reserve
;; The amount to stack is kept as a data var in the stx reserve
;; Stacks the STX tokens in PoX-2
;; mainnet pox contract: SP000000000000000000002Q6VF78.pox-2 TODO: update
;; https://github.com/stacks-network/stacks-blockchain/blob/next/src/chainstate/stacks/boot/pox-2.clar
;; random addr to use for hashbytes testing
;; 0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac
;; 0x00

(define-constant ERR-NOT-AUTHORIZED u19401)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u191)
(define-constant ERR-WRONG-STACKER u192)
(define-constant ERR-WRONG-COLLATERAL-TOKEN u193)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u195)
(define-constant ERR-VAULT-LIQUIDATED u196)
(define-constant ERR-STILL-STACKING u197)

(define-data-var stacking-unlock-burn-height uint u0) ;; when is this cycle over
(define-data-var stacking-stx-stacked uint u0) ;; how many stx did we stack in this cycle
(define-data-var stacker-shutdown-activated bool false)
(define-data-var stacker-name (string-ascii 256) "stacker-2")

(define-read-only (get-stacking-unlock-burn-height)
  (ok (var-get stacking-unlock-burn-height))
)

(define-read-only (get-stacking-stx-stacked)
  (ok (var-get stacking-stx-stacked))
)

(define-read-only (get-stacker-info)
  (stx-account (as-contract tx-sender))
)

(define-public (toggle-stacker-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacker-shutdown-activated (not (var-get stacker-shutdown-activated))))
  )
)

;; this should be called only once in Stacks 2.1
;; additional calls should be made with `stack-extend` and `stack-increase` in this contract
;; lock-period should be u1 and when it runs out, `stack-extend` should be called to extend with 1 period
(define-public (initiate-stacking (pox-addr (tuple (version (buff 1)) (hashbytes (buff 32))))
                                  (start-burn-ht uint)
                                  (lock-period uint))
  ;; 1. check `get-stacking-minimum` or `can-stack-stx` to see if we have > minimum tokens
  ;; 2. call `stack-stx` for `lock-period` periods
  (let (
    (tokens-to-stack (unwrap! (contract-call? .arkadiko-stx-reserve-v1-1 get-tokens-to-stack (var-get stacker-name)) (ok u0)))
    (stx-balance (get-stx-balance))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; check if we can stack - if not, then probably cause we have not reached the minimum with tokens-to-stack
    ;; TODO: update contract address for mainnet
    (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox-2 can-stack-stx pox-addr tokens-to-stack start-burn-ht lock-period))
      success (begin
        (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-stack (var-get stacker-name) tokens-to-stack))
        (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox-2 stack-stx tokens-to-stack pox-addr start-burn-ht lock-period))
          result (begin
            (print result)
            (print (stx-account (as-contract tx-sender)))
            (var-set stacking-unlock-burn-height (get unlock-burn-height result))
            (var-set stacking-stx-stacked (get lock-amount result))
            (try! (contract-call? .arkadiko-freddie-v1-1 set-stacking-unlock-burn-height (var-get stacker-name) (get unlock-burn-height result)))
            (ok (get lock-amount result))
          )
          error (begin
            (print (err (to-uint error)))
          )
        )
      )
      failure (print (err (to-uint failure)))
    )
  )
)

;; should be called to add additional STX tokens stacking
;; if there is net outflow of STX between two cycles, does not need to be called
;; before calling this, consolidate the new amount of tokens to stack in PoX in stx-reserve `set-tokens-to-stack`
;; then call this first, before a new cycle starts (every 2100 blocks)
;; after calling this, call `stack-extend`
(define-public (stack-increase (for-stacker (string-ascii 256)) (additional-tokens-to-stack uint))
  (let (
    (stx-balance (get-stx-balance))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-stack for-stacker additional-tokens-to-stack))
    (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox-2 stack-increase additional-tokens-to-stack))
      result (begin
        (print result)
        (var-set stacking-stx-stacked (get total-locked result))
        (ok (get total-locked result))
      )
      error (begin
        (print (get-stx-balance))
        (print (err (to-uint error)))
      )
    )
  )
)

;; this should be called just before a new cycle starts to extend with another cycle
;; `extend-count` should always be 1 (if all is well)
;; we can extend by 1 cycle each 2100 blocks, that way everyone can always unstack if they want (after a cycle ends)
(define-public (stack-extend (extend-count uint) (pox-addr { version: (buff 1), hashbytes: (buff 32) }))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox-2 stack-extend extend-count pox-addr))
      result (begin
        (print result)
        (var-set stacking-unlock-burn-height (get unlock-burn-height result))
        (try! (contract-call? .arkadiko-freddie-v1-1 set-stacking-unlock-burn-height (var-get stacker-name) (get unlock-burn-height result)))
        (ok (get unlock-burn-height result))
      )
      error (begin
        (print (err (to-uint error)))
      )
    )
  )
)

(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; return STX to the STX reserve
;; can be used when deprecating this stacker logic
(define-public (return-stx (ustx-amount uint))
  (begin
    (as-contract
      (stx-transfer? ustx-amount tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
    )
  )
)
