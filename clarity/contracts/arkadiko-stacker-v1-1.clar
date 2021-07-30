(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

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
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u193)
(define-constant ERR-ALREADY-STACKING u194)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u195)
(define-constant ERR-WRONG-COLLATERAL-TOKEN u196)
(define-constant ERR-VAULT-LIQUIDATED u197)

(define-data-var stacking-unlock-burn-height uint u0) ;; when is this cycle over
(define-data-var stacking-stx-stacked uint u0) ;; how many stx did we stack in this cycle
(define-data-var stacking-stx-received uint u0) ;; how many btc did we convert into STX tokens to add to vault collateral
(define-data-var payout-vault-id uint u0)
(define-data-var stacker-shutdown-activated bool false)

(define-read-only (get-stacking-unlock-burn-height)
  (ok (var-get stacking-unlock-burn-height))
)

(define-read-only (get-stacking-stx-stacked)
  (ok (var-get stacking-stx-stacked))
)

;; Setter to be called when the DAO address has turned PoX yield from BTC into STX
;; This indicates the amount of STX that was earned from PoX
(define-public (set-stacking-stx-received (stx-received uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacking-stx-received stx-received))
  )
)

(define-public (toggle-stacker-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

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
    (stx-balance (unwrap-panic (get-stx-balance)))
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
    (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox can-stack-stx pox-addr tokens-to-stack start-burn-ht lock-period))
      success (begin
        (if (> tokens-to-stack stx-balance)
          (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-stack (- tokens-to-stack stx-balance)))
          true
        )
        (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox stack-stx tokens-to-stack pox-addr start-burn-ht lock-period))
          result (begin
            (print result)
            (var-set stacking-unlock-burn-height (get unlock-burn-height result))
            (var-set stacking-stx-stacked (get lock-amount result))
            (try! (contract-call? .arkadiko-freddie-v1-1 set-stacking-unlock-burn-height (get unlock-burn-height result)))
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

;; can be called by the stx reserve to request STX tokens for withdrawal
;; this can be called per vault that has set revoked stacking to true
(define-public (request-stx-for-withdrawal (ustx-amount uint))
  (begin
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (as-contract
      (stx-transfer? ustx-amount (as-contract tx-sender) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
    )
  )
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
(define-public (payout
  (vault-id uint)
  (wstx <ft-trait>)
  (usda <ft-trait>)
  (coll-type <collateral-types-trait>)
  (reserve <vault-trait>)
  (ft <ft-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq "xSTX" (get collateral-token vault))
        (is-eq "STX" (get collateral-token vault))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (>= burn-block-height (var-get stacking-unlock-burn-height)) (err ERR-BURN-HEIGHT-NOT-REACHED))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (if (and (get is-liquidated vault) (get auction-ended vault))
      (try! (payout-liquidated-vault vault-id))
      (try! (payout-vault vault-id wstx usda coll-type reserve ft))
    )
    (ok true)
  )
)

(define-private (payout-liquidated-vault (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (stacking-lots (contract-call? .arkadiko-vault-data-v1-1 get-stacking-payout-lots vault-id))
  )
    (asserts! (is-eq (get is-liquidated vault) true) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get auction-ended vault) true) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get stacked-tokens vault) u0) (err ERR-NOT-AUTHORIZED))

    (var-set payout-vault-id (get id vault))
    (map payout-lot-bidder (get ids stacking-lots))
    (ok true)
  )
)

(define-private (payout-lot-bidder (lot-index uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id (var-get payout-vault-id)))
    (stx-in-vault (- (get stacked-tokens vault) (/ (get stacked-tokens vault) u10))) ;; we keep 10%
    (stacker-payout (contract-call? .arkadiko-vault-data-v1-1 get-stacking-payout (get id vault) lot-index))
    (percentage (/ (* u100000 (get collateral-amount stacker-payout)) stx-in-vault)) ;; in basis points
    (basis-points (/ (* u100000 stx-in-vault) (var-get stacking-stx-stacked))) ;; this gives the percentage of collateral bought in auctions vs stx stacked
    (earned-amount-vault (/ (* (var-get stacking-stx-received) basis-points) u100000))
    (earned-amount-bidder (/ (* percentage earned-amount-vault) u100000))
  )
    (try! (as-contract (stx-transfer? earned-amount-bidder (as-contract tx-sender) (get principal stacker-payout))))
    (ok true)
  )
)

(define-read-only (calculate-vault-reward (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (basis-points (/ (* u10000 (get stacked-tokens vault)) (var-get stacking-stx-stacked))) ;; (100 * 100 * vault-stacked-tokens / stx-stacked)
  )
    (/ (* (var-get stacking-stx-received) basis-points) u10000)
  )
)

(define-private (payout-vault
  (vault-id uint)
  (wstx <ft-trait>)
  (usda <ft-trait>)
  (coll-type <collateral-types-trait>)
  (reserve <vault-trait>)
  (ft <ft-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (earned-amount (calculate-vault-reward vault-id))
    (new-collateral-amount (+ earned-amount (get collateral vault)))
  )
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get stacked-tokens vault) u0) (err ERR-NOT-AUTHORIZED))

    (if (get auto-payoff vault)
      (begin
        (try! (contract-call? .arkadiko-stx-reserve-v1-1 request-stx-to-auto-payoff earned-amount))
        (try! (payoff-vault-debt vault-id earned-amount wstx usda coll-type reserve ft))
        (if (get revoked-stacking vault)
          (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault { 
            updated-at-block-height: block-height, 
            stacked-tokens: u0
          })))
          true
        )
      )
      (begin
        (if (get revoked-stacking vault)
          (begin
            (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault { 
              updated-at-block-height: block-height, 
              stacked-tokens: u0,
              collateral: new-collateral-amount 
            })))
            (try! (as-contract (request-stx-for-withdrawal new-collateral-amount)))
          )
          (begin
            (try! (contract-call? .arkadiko-stx-reserve-v1-1 add-tokens-to-stack earned-amount))
            (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
              updated-at-block-height: block-height,
              stacked-tokens: new-collateral-amount,
              collateral: new-collateral-amount
            })))
          )
        )
      )
    )

    ;; Update vault-rewards
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 add-collateral earned-amount (get owner vault)))

    (ok true)
  )
)

;; 1. turn STX into USDA on swap
;; 2. pay off stability fee
;; 3. pay off (burn) partial debt
(define-private (payoff-vault-debt
  (vault-id uint)
  (earned-stx-amount uint)
  (wstx <ft-trait>)
  (usda <ft-trait>)
  (coll-type <collateral-types-trait>)
  (reserve <vault-trait>)
  (ft <ft-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (swapped-amounts (unwrap-panic (as-contract (contract-call? .arkadiko-swap-v1-1 swap-x-for-y wstx usda earned-stx-amount u1))))
    (usda-amount (unwrap-panic (element-at swapped-amounts u1)))
    (stability-fee (unwrap-panic (contract-call? .arkadiko-freddie-v1-1 get-stability-fee-for-vault vault-id coll-type)))
    (leftover-usda
      (if (> usda-amount stability-fee)
        (- usda-amount stability-fee)
        u0
      )
    )
  )
    (asserts! (>= usda-amount stability-fee) (ok true))
    (try! (contract-call? .arkadiko-freddie-v1-1 pay-stability-fee vault-id coll-type))
    (asserts! (> leftover-usda u0) (ok true))

    (if (>= (get debt vault) leftover-usda)
      (try! (contract-call? .arkadiko-freddie-v1-1 burn vault-id leftover-usda reserve ft coll-type))
      (begin
        ;; this is the last payment - after this we paid off all debt
        ;; we leave the vault open and keep stacking in PoX for the user
        (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
          updated-at-block-height: block-height,
          auto-payoff: false
        })))
        (let (
          (excess-usda (- leftover-usda (get debt vault)))
        )
          (try! (contract-call? .arkadiko-freddie-v1-1 burn vault-id (get debt vault) reserve ft coll-type))
          (try! (as-contract (contract-call? .usda-token transfer excess-usda (as-contract tx-sender) (get owner vault) none)))
        )
      )
    )
    (ok true)
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
    (asserts! (is-eq true (get revoked-stacking vault)) (err ERR-ALREADY-STACKING))
    (asserts!
      (or
        (is-eq u0 (var-get stacking-stx-stacked))
        (>= burn-block-height (var-get stacking-unlock-burn-height))
      )
      (err ERR-BURN-HEIGHT-NOT-REACHED)
    )

    (if (> (var-get stacking-stx-stacked) u0)
      (try! (as-contract (request-stx-for-withdrawal (get collateral vault))))
      false
    )
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        stacked-tokens: u0,
        updated-at-block-height: block-height
      }))
    )
    (ok true)
  )
)

(define-read-only (get-stx-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)
