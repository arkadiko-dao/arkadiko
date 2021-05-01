(impl-trait .stacker-trait.stacker-trait)

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
(define-constant ERR-CANNOT-STACK u191)
(define-constant ERR-FAILED-STACK-STX u192)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u193)
(define-constant ERR-ALREADY-STACKING u194)
(define-constant CONTRACT-OWNER tx-sender)

(define-data-var stacking-unlock-burn-height uint u0) ;; when is this cycle over
(define-data-var stacking-stx-stacked uint u0) ;; how many stx did we stack in this cycle
(define-data-var stacking-stx-received uint u0) ;; how many btc did we convert into STX tokens to add to vault collateral
(define-data-var stacking-stx-in-vault uint u0)

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

(define-public (set-stacking-stx-received (stx-received uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-NOT-AUTHORIZED))

    (ok (var-set stacking-stx-received stx-received))
  )
)

(define-public (initiate-stacking (pox-addr (tuple (version (buff 1)) (hashbytes (buff 20))))
                                  (start-burn-ht uint)
                                  (lock-period uint))
  ;; 1. check `get-stacking-minimum` or `can-stack-stx` to see if we have > minimum tokens
  ;; 2. call `stack-stx` for 1 `lock-period` fixed
  (let (
    (tokens-to-stack (unwrap! (contract-call? .stx-reserve get-tokens-to-stack) (ok u0)))
    (can-stack (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox can-stack-stx pox-addr tokens-to-stack start-burn-ht lock-period)))
    (stx-balance (unwrap-panic (get-stx-balance)))
  )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= burn-block-height (var-get stacking-unlock-burn-height)) (err ERR-ALREADY-STACKING))

    ;; check if we can stack - if not, then probably cause we have not reached the minimum with (var-get tokens-to-stack)
    (if (unwrap! can-stack (err ERR-CANNOT-STACK))
      (begin
        (try! (contract-call? .stx-reserve request-stx-to-stack (- tokens-to-stack stx-balance)))
        (let (
          (result
            (unwrap!
              (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox stack-stx tokens-to-stack pox-addr start-burn-ht lock-period))
              (err ERR-FAILED-STACK-STX)
            )
          )
        )
          (var-set stacking-unlock-burn-height (get unlock-burn-height result))
          (var-set stacking-stx-stacked (get lock-amount result))
          (ok (get lock-amount result))
        )
      )
      (err ERR-CANNOT-STACK)
    )
  )
)

;; can be called by the stx reserve to request STX tokens for withdrawal
(define-public (request-stx-for-withdrawal (ustx-amount uint))
  (begin
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .dao get-qualified-name-by-name "stacker")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (as-contract
      (stx-transfer? ustx-amount (as-contract tx-sender) (unwrap-panic (contract-call? .dao get-qualified-name-by-name "stx-reserve")))
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
(define-public (payout (vault-id uint))
  (let (
    (vault (contract-call? .vault-data get-vault-by-id vault-id))
  )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq "xSTX" (get collateral-token vault))
        (is-eq "STX" (get collateral-token vault))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (>= burn-block-height (var-get stacking-unlock-burn-height)) (err ERR-BURN-HEIGHT-NOT-REACHED))

    (if (and (get is-liquidated vault) (get auction-ended vault))
      (try! (payout-liquidated-vault vault-id))
      (try! (payout-vault vault-id))
    )
    ;; (var-set stacking-stx-received u0) ;; set manually back to 0 after we paid everyone, since this method is for 1 vault only
    (ok true)
  )
)

(define-private (payout-liquidated-vault (vault-id uint))
  (let (
    (vault (contract-call? .vault-data get-vault-by-id vault-id))
    (stacking-entry (contract-call? .vault-data get-stacking-payout vault-id))
  )
    (asserts! (is-eq (get is-liquidated vault) true) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get auction-ended vault) true) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get stacked-tokens vault) u0) (err ERR-NOT-AUTHORIZED))

    (var-set stacking-stx-in-vault (get collateral-amount stacking-entry))
    (map payout-lot-bidder (get principals stacking-entry))
    (ok true)
  )
)

(define-private (payout-lot-bidder (data (tuple (collateral-amount uint) (recipient principal))))
  (let (
    (stx-in-vault (var-get stacking-stx-in-vault))
    (percentage (/ (* u100000 (get collateral-amount data)) stx-in-vault)) ;; in basis points
    (basis-points (/ (* u100000 stx-in-vault) (var-get stacking-stx-stacked))) ;; this gives the percentage of collateral bought in auctions vs stx stacked
    (earned-amount-vault (/ (* (var-get stacking-stx-received) basis-points) u100000))
    (earned-amount-bidder (/ (* percentage earned-amount-vault) u100000))
  )
    (try! (as-contract (stx-transfer? earned-amount-bidder (as-contract tx-sender) (get recipient data))))
    (ok true)
  )
)

(define-private (calculate-vault-reward (vault-id uint))
  (let (
    (vault (contract-call? .vault-data get-vault-by-id vault-id))
    (basis-points (/ (* u10000 (get stacked-tokens vault)) (var-get stacking-stx-stacked))) ;; (100 * 100 * vault-stacked-tokens / stx-stacked)
  )
    (/ (* (var-get stacking-stx-received) basis-points) u10000)
  )
)

(define-private (payout-vault (vault-id uint))
  (let (
    (vault (contract-call? .vault-data get-vault-by-id vault-id))
    (earned-amount (calculate-vault-reward vault-id))
    (new-collateral-amount (+ earned-amount (get collateral vault)))
  )
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get stacked-tokens vault) u0) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? .vault-data update-vault vault-id (merge vault { collateral: new-collateral-amount })))
    (if (get revoked-stacking vault)
      (begin
        (try! (contract-call? .vault-data update-vault vault-id (merge vault { updated-at-block-height: block-height, stacked-tokens: u0 })))
        (try! (request-stx-for-withdrawal new-collateral-amount))
      )
      (try! (contract-call? .vault-data update-vault vault-id (merge vault {
        updated-at-block-height: block-height,
        stacked-tokens: new-collateral-amount,
        collateral: new-collateral-amount
      })))
    )
    (ok true)
  )
)

(define-read-only (get-stx-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)
