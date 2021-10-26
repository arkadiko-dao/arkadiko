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

(define-constant ERR-NOT-AUTHORIZED u19401)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u191)
(define-constant ERR-WRONG-STACKER u192)
(define-constant ERR-WRONG-COLLATERAL-TOKEN u193)
(define-constant ERR-ALREADY-STACKING u194)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u195)
(define-constant ERR-VAULT-LIQUIDATED u196)
(define-constant ERR-STILL-STACKING u197)

(define-data-var stacking-unlock-burn-height uint u0) ;; when is this cycle over
(define-data-var stacking-stx-stacked uint u0) ;; how many stx did we stack in this cycle
(define-data-var stacker-shutdown-activated bool false)
(define-data-var stacker-name (string-ascii 256) "stacker")

(define-read-only (get-stacking-unlock-burn-height)
  (ok (var-get stacking-unlock-burn-height))
)

(define-read-only (get-stacking-stx-stacked)
  (ok (var-get stacking-stx-stacked))
)

(define-public (toggle-stacker-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacker-shutdown-activated (not (var-get stacker-shutdown-activated))))
  )
)

(define-public (initiate-stacking (pox-addr (tuple (version (buff 1)) (hashbytes (buff 20))))
                                  (start-burn-ht uint)
                                  (lock-period uint))
  ;; 1. check `get-stacking-minimum` or `can-stack-stx` to see if we have > minimum tokens
  ;; 2. call `stack-stx` for 1 `lock-period` fixed
  (let (
    (tokens-to-stack (unwrap! (contract-call? .arkadiko-stx-reserve-v1-1 get-tokens-to-stack (var-get stacker-name)) (ok u0)))
    (stx-balance (get-stx-balance))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= burn-block-height (var-get stacking-unlock-burn-height)) (err ERR-ALREADY-STACKING))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; check if we can stack - if not, then probably cause we have not reached the minimum with tokens-to-stack
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox can-stack-stx pox-addr tokens-to-stack start-burn-ht lock-period))
      success (begin
        (if (> tokens-to-stack stx-balance)
          (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-stack (var-get stacker-name) (- tokens-to-stack stx-balance)))
          true
        )
        (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox stack-stx tokens-to-stack pox-addr start-burn-ht lock-period))
          result (begin
            (print result)
            (var-set stacking-unlock-burn-height (get unlock-burn-height result))
            (var-set stacking-stx-stacked (get lock-amount result))
            (try! (contract-call? .arkadiko-freddie-v1-1 set-stacking-unlock-burn-height (var-get stacker-name) (get unlock-burn-height result)))
            (try! (contract-call? .arkadiko-stacker-payer-v1-1 set-stacking-unlock-burn-height (get unlock-burn-height result)))
            (try! (contract-call? .arkadiko-stacker-payer-v1-1 set-stacking-stx-stacked (get lock-amount result)))
            (try! (contract-call? .arkadiko-stx-reserve-v1-1 set-next-stacker-name "stacker-2"))
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

(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; return STX to the STX reserve
;; can be used when deprecating this stacker logic
(define-public (return-stx (ustx-amount uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (as-contract
      (stx-transfer? ustx-amount tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
    )
  )
)

;; This method should be ran by anyone
;; after a stacking cycle ends to allow withdrawal of STX collateral
;; Only mark vaults that have revoked stacking and not been liquidated
;; must be called before a new initiate-stacking method call (stacking cycle)
(define-public (enable-vault-withdrawals (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq "STX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq false (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq true (get revoked-stacking vault)) (err ERR-STILL-STACKING))
    (asserts!
      (or
        (is-eq u0 (var-get stacking-stx-stacked))
        (>= burn-block-height (var-get stacking-unlock-burn-height))
      )
      (err ERR-BURN-HEIGHT-NOT-REACHED)
    )
    (asserts! (is-eq (var-get stacker-name) (get stacker-name vault)) (err ERR-WRONG-STACKER))

    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        stacked-tokens: u0,
        updated-at-block-height: block-height
      }))
    )
    (ok true)
  )
)

;; we probably won't need this method in production.. but used in tests
(define-public (request-stx-for-payout (ustx-amount uint))
  (begin
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer")))
        (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (as-contract
      (stx-transfer? ustx-amount tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer")))
    )
  )
)
