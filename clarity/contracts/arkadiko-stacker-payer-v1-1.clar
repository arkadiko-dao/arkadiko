(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u222)

(define-data-var stacking-stx-stacked uint u0) ;; how many stx did we stack in this cycle
(define-data-var stacking-stx-received uint u0) ;; how many btc did we convert into STX tokens to add to vault collateral
(define-data-var stacking-unlock-burn-height uint u0) ;; when is this cycle over
(define-data-var payout-vault-id uint u0)
(define-data-var stacker-payer-shutdown-activated bool false)

(define-public (toggle-stacker-payer-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacker-payer-shutdown-activated (not (var-get stacker-payer-shutdown-activated))))
  )
)

(define-read-only (get-stacking-stx-stacked)
  (ok (var-get stacking-stx-stacked))
)

(define-public (set-stacking-stx-stacked (amount uint))
  (begin
    (asserts!
      (or
        (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (ok (var-set stacking-stx-stacked amount))
  )
)

(define-read-only (get-stacking-unlock-burn-height)
  (ok (var-get stacking-unlock-burn-height))
)

(define-public (set-stacking-unlock-burn-height (height uint))
  (begin
    (asserts!
      (or
        (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (ok (var-set stacking-unlock-burn-height height))
  )
)

;; Setter to be called when the DAO address has turned PoX yield from BTC into STX
;; This indicates the amount of STX that was earned from PoX
(define-public (set-stacking-stx-received (stx-received uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-payer-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacking-stx-received stx-received))
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
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
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
        (is-eq (var-get stacker-payer-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (if (and (get is-liquidated vault) (get auction-ended vault))
      (try! (payout-liquidated-vault vault-id))
      (try! (payout-vault vault-id wstx usda coll-type reserve ft))
    )
    (print { type: "vault", action: "payout", data: vault })
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
    (try! (as-contract (stx-transfer? earned-amount-bidder tx-sender (get principal stacker-payout))))
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
            (try! (return-stx-to-reserve new-collateral-amount))
          )
          (begin
            (try! (contract-call? .arkadiko-stx-reserve-v1-1 add-tokens-to-stack (get stacker-name vault) earned-amount))
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
    (swapped-amounts (unwrap-panic (as-contract (contract-call? .arkadiko-swap-v1-1 swap-x-for-y wstx usda earned-stx-amount u0))))
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
    (try! (as-contract (contract-call? .arkadiko-freddie-v1-1 pay-stability-fee vault-id coll-type)))
    (asserts! (> leftover-usda u0) (ok true))

    (if (>= (get debt vault) leftover-usda)
      (try! (as-contract (contract-call? .arkadiko-freddie-v1-1 burn vault-id leftover-usda reserve ft coll-type)))
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
          (try! (as-contract (contract-call? .arkadiko-freddie-v1-1 burn vault-id (get debt vault) reserve ft coll-type)))
          (try! (as-contract (contract-call? .usda-token transfer excess-usda tx-sender (get owner vault) none)))
        )
      )
    )
    (ok true)
  )
)

;; can be called by contract to send STX tokens back to STX reserve
;; this should be called per vault that has set revoked stacking to true
(define-private (return-stx-to-reserve (ustx-amount uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get stacker-payer-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (if (> ustx-amount u0)
      (as-contract
        (stx-transfer? ustx-amount tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
      )
      (ok true)
    )
  )
)
