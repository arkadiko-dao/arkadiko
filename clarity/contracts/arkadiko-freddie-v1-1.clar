(impl-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait mock-ft-trait .arkadiko-mock-ft-trait-v1.mock-ft-trait)
(use-trait stacker-trait .arkadiko-stacker-trait-v1.stacker-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)

;; Freddie - The Vault Manager
;; Freddie is an abstraction layer that interacts with collateral type reserves
;; Ideally, collateral reserves should never be called from outside. Only manager layers should be interacted with from clients

;; errors
(define-constant ERR-NOT-AUTHORIZED u4401)
(define-constant ERR-TRANSFER-FAILED u42)
(define-constant ERR-MINTER-FAILED u43)
(define-constant ERR-BURN-FAILED u44)
(define-constant ERR-DEPOSIT-FAILED u45)
(define-constant ERR-WITHDRAW-FAILED u46)
(define-constant ERR-MINT-FAILED u47)
(define-constant ERR-LIQUIDATION-FAILED u48)
(define-constant ERR-INSUFFICIENT-COLLATERAL u49)
(define-constant ERR-MAXIMUM-DEBT-REACHED u410)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u411)
(define-constant ERR-BURN-HEIGHT-NOT-REACHED u412)
(define-constant ERR-VAULT-LIQUIDATED u413)
(define-constant ERR-STACKING-IN-PROGRESS u414)
(define-constant ERR-WRONG-COLLATERAL-TOKEN u415)
(define-constant ERR-VAULT-NOT-LIQUIDATED u416)
(define-constant ERR-WRONG-DEBT u417)
(define-constant ERR-AUCTION-NOT-ENDED u418)

;; constants
(define-constant BLOCKS-PER-DAY u144)

(define-data-var stx-redeemable uint u0) ;; how much STX is available to trade for xSTX
(define-data-var block-height-last-paid uint u0) ;; when the foundation was last paid
(define-data-var maximum-debt-surplus uint u10000000000000) ;; 10 million default - above that we sell the xUSD on the DIKO/xUSD pair to burn DIKO
(define-data-var freddie-shutdown-activated bool false)

;; getters
(define-read-only (get-stx-redeemable)
  (ok (var-get stx-redeemable))
)

(define-private (add-stx-redeemable (token-amount uint))
  (begin
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    (ok (var-set stx-redeemable (+ token-amount (var-get stx-redeemable))))
  )
)

(define-private (subtract-stx-redeemable (token-amount uint))
  (if true
    (ok (var-set stx-redeemable (- (var-get stx-redeemable) token-amount)))
    (err u0)
  )
)

(define-read-only (get-vault-by-id (vault-id uint))
  (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id)
)

(define-read-only (get-vault-entries (user principal))
  (contract-call? .arkadiko-vault-data-v1-1 get-vault-entries user)
)

(define-read-only (get-collateral-type-for-vault (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (ok (get collateral-type vault))
  )
)

(define-read-only (get-collateral-token-for-vault (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (ok (get collateral-token vault))
  )
)

(define-read-only (calculate-current-collateral-to-debt-ratio (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (if (is-eq (get is-liquidated vault) true)
      (ok u0)
      (begin
        (let ((stx-price-in-cents (contract-call? .arkadiko-oracle-v1-1 get-price (get collateral-token vault))))
          (if (> (get debt vault) u0)
            (ok
              (/
                (* (get collateral vault) (get last-price-in-cents stx-price-in-cents))
                ;; (get debt vault)
                ;; TODO: cost is too high to use this in the front-end - fix this
                (+ (get debt vault) (unwrap-panic (get-stability-fee-for-vault vault-id)))
              )
            )
            (err u0)
          )
        )
      )
    )
  )
)

(define-private (resolve-stacking-amount (collateral-amount uint) (collateral-token (string-ascii 12)))
  (if (is-eq collateral-token "STX")
    collateral-amount
    u0
  )
)

;; can be called by the vault owner on a non-liquidated STX vault
;; used to indicate willingness to stack/unstack the collateral in the PoX contract
(define-public (toggle-stacking (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq "STX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq false (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (try! (contract-call? .arkadiko-stx-reserve-v1-1 toggle-stacking (not (get revoked-stacking vault)) (get collateral vault)))

    (try!
      (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        revoked-stacking: (not (get revoked-stacking vault)),
        updated-at-block-height: block-height
      }))
    )
    (ok true)
  )
)

;; can be called by the vault owner on a non-liquidated STX vault
;; called when collateral was unstacked & want to stack again
(define-public (stack-collateral (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq "STX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq false (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq u0 (get stacked-tokens vault)) (err ERR-STACKING-IN-PROGRESS))

    (try! (contract-call? .arkadiko-stx-reserve-v1-1 add-tokens-to-stack (get collateral vault)))
    (try!
      (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        stacked-tokens: (get collateral vault),
        revoked-stacking: false,
        updated-at-block-height: block-height,
      }))
    )
    (ok true)
  )
)

;; This method should be ran by the deployer (contract owner)
;; after a stacking cycle ends to allow withdrawal of STX collateral
;; Only mark vaults that have revoked stacking and not been liquidated
;; must be called before a new initiate-stacking method call (stacking cycle)
(define-public (enable-vault-withdrawals (stacker <stacker-trait>) (vault-id uint))
  (let (
    (vault (get-vault-by-id vault-id))
    (stx-stacked (unwrap-panic (contract-call? stacker get-stacking-stx-stacked)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq "STX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq false (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq true (get revoked-stacking vault)) (err ERR-STACKING-IN-PROGRESS))
    (asserts! (is-eq (contract-of stacker) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq u0 stx-stacked)
        (>= burn-block-height (unwrap-panic (contract-call? stacker get-stacking-unlock-burn-height)))
      )
      (err ERR-BURN-HEIGHT-NOT-REACHED)
    )

    (if (> u0 stx-stacked)
      (try! (contract-call? stacker request-stx-for-withdrawal (get collateral vault)))
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

;; method that can only be called by deployer (contract owner)
;; unlocks STX that had their xSTX derivative liquidated in an auction
(define-public (release-stacked-stx (stacker <stacker-trait>) (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq "xSTX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq true (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (asserts! (> (get stacked-tokens vault) u0) (err ERR-STACKING-IN-PROGRESS))
    (asserts! (is-eq (contract-of stacker) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= burn-block-height (unwrap-panic (contract-call? stacker get-stacking-unlock-burn-height))) (err ERR-BURN-HEIGHT-NOT-REACHED))

    (try! (add-stx-redeemable (get stacked-tokens vault)))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        stacked-tokens: u0,
        updated-at-block-height: block-height
      }))
    )
    (ok true)
  )
)

(define-private (min-of (i1 uint) (i2 uint))
  (if (< i1 i2)
      i1
      i2))

;; redeem stx (and burn xSTX)
(define-public (redeem-stx (ustx-amount uint))
  (let ((stx (var-get stx-redeemable)))
    (if (> stx u0)
      (begin
        (try! (contract-call? .arkadiko-sip10-reserve-v1-1 burn-xstx (min-of stx ustx-amount) tx-sender))
        (try! (contract-call? .arkadiko-stx-reserve-v1-1 redeem-xstx (min-of stx ustx-amount) tx-sender))
        (try! (subtract-stx-redeemable (min-of stx ustx-amount)))
        (ok true)
      )
      (ok false)
    )
  )
)

(define-public (toggle-freddie-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set freddie-shutdown-activated (not (var-get freddie-shutdown-activated))))
  )
)



(define-public (collateralize-and-mint
    (collateral-amount uint)
    (debt uint)
    (collateral-type (string-ascii 12))
    (reserve <vault-trait>)
    (ft <mock-ft-trait>)
  )
  (let (
    (sender tx-sender)
    (collateral-token (get token (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-collateral-type-by-name collateral-type))))
    (ratio (unwrap! (contract-call? reserve calculate-current-collateral-to-debt-ratio collateral-token debt collateral-amount) (err ERR-WRONG-DEBT)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (>= ratio (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-liquidation-ratio collateral-type))) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts!
      (<
        (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-total-debt collateral-type))
        (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-maximum-debt collateral-type))
      )
      (err ERR-MAXIMUM-DEBT-REACHED)
    )
    (asserts!
      (or
        (is-eq collateral-token "STX")
        (is-eq (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-token-address collateral-type)) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (try! (contract-call? reserve collateralize-and-mint ft collateral-token collateral-amount debt sender))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .xusd-token debt sender)))
    (let (
      (vault-id (+ (contract-call? .arkadiko-vault-data-v1-1 get-last-vault-id) u1))
      (vault {
        id: vault-id,
        owner: sender,
        collateral: collateral-amount,
        collateral-type: collateral-type,
        collateral-token: collateral-token,
        stacked-tokens: (resolve-stacking-amount collateral-amount collateral-token),
        revoked-stacking: false,
        debt: debt,
        created-at-block-height: block-height,
        updated-at-block-height: block-height,
        stability-fee-accrued: u0,
        stability-fee-last-accrued: block-height,
        is-liquidated: false,
        auction-ended: false,
        leftover-collateral: u0
      })
    )
      (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault-entries sender vault-id))
      (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id vault))
      (try! (contract-call? .arkadiko-vault-rewards-v1-1 add-collateral collateral-amount sender))
      (try! (contract-call? .arkadiko-vault-data-v1-1 set-last-vault-id vault-id))
      (try! (contract-call? .arkadiko-collateral-types-v1-1 add-debt-to-collateral-type collateral-type debt))
      (print { type: "vault", action: "created", data: vault })
      (ok debt)
    )
  )
)

(define-public (deposit (vault-id uint) (uamount uint) (reserve <vault-trait>) (ft <mock-ft-trait>))
  (let (
    (vault (get-vault-by-id vault-id))
    (collateral-token (unwrap-panic (get-collateral-token-for-vault vault-id)))
    (new-collateral (+ uamount (get collateral vault)))
    (updated-vault (merge vault {
      collateral: new-collateral,
      updated-at-block-height: block-height
    }))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts!
      (or
        (is-eq collateral-token "STX")
        (is-eq (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (unwrap! (contract-call? reserve deposit ft collateral-token uamount) (err ERR-DEPOSIT-FAILED))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 add-collateral uamount (get owner vault)))
    (print { type: "vault", action: "deposit", data: updated-vault })
    (ok true)
  )
)

(define-public (withdraw (vault-id uint) (uamount uint) (reserve <vault-trait>) (ft <mock-ft-trait>))
  (let (
    (vault (get-vault-by-id vault-id))
    (collateral-token (unwrap-panic (get-collateral-token-for-vault vault-id)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> uamount u0) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts! (<= uamount (get collateral vault)) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts! (is-eq u0 (get stacked-tokens vault)) (err ERR-STACKING-IN-PROGRESS))
    (asserts!
      (or
        (is-eq collateral-token "STX")
        (is-eq (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (let ((ratio (unwrap-panic 
            (contract-call? 
              reserve 
              calculate-current-collateral-to-debt-ratio 
              (get collateral-token vault) 
              (get debt vault) 
              (- (get collateral vault) uamount))))
          (new-collateral (- (get collateral vault) uamount))
          (updated-vault (merge vault {
            collateral: new-collateral,
            updated-at-block-height: block-height
          })))
      ;; TODO: FIX (make "STX" dynamic)
      (asserts! (>= ratio (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-collateral-to-debt-ratio (get collateral-type vault)))) (err ERR-INSUFFICIENT-COLLATERAL))
      (unwrap! (contract-call? reserve withdraw ft collateral-token (get owner vault) uamount) (err ERR-WITHDRAW-FAILED))
      (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
      (try! (contract-call? .arkadiko-vault-rewards-v1-1 remove-collateral uamount (get owner vault)))
      (print { type: "vault", action: "withdraw", data: updated-vault })
      (ok true)
    )
  )
)

(define-public (mint (vault-id uint) (extra-debt uint) (reserve <vault-trait>))
  (let ((vault (get-vault-by-id vault-id))
       (new-total-debt (+ extra-debt (get debt vault)))
       (updated-vault (merge vault {
          debt: new-total-debt,
          updated-at-block-height: block-height
        })))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (<
        (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-total-debt (get collateral-type vault)))
        (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-maximum-debt (get collateral-type vault)))
      )
      (err ERR-MAXIMUM-DEBT-REACHED)
    )

    (try! (pay-stability-fee vault-id))
    (try! (contract-call? reserve mint
        (get collateral-token vault)
        (get owner vault)
        (get collateral vault)
        (get debt vault)
        extra-debt
        (get collateral-type vault)
      )
    )
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
    (try! (contract-call? .arkadiko-collateral-types-v1-1 add-debt-to-collateral-type (get collateral-type vault) extra-debt))
    (print { type: "vault", action: "mint", data: updated-vault })
    (ok true)
  )
)

(define-public (burn (vault-id uint) (debt uint) (reserve <vault-trait>) (ft <mock-ft-trait>))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= debt (get debt vault)) (err ERR-WRONG-DEBT))
    (asserts!
      (or
        (is-eq (get collateral-token vault) "STX")
        (is-eq (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (try! (pay-stability-fee vault-id))
    (if (is-eq debt (get debt vault))
      (close-vault vault-id reserve ft)
      (burn-partial-debt vault-id debt reserve ft)
    )
  )
)

(define-private (close-vault (vault-id uint) (reserve <vault-trait>) (ft <mock-ft-trait>))
  (let ((vault (get-vault-by-id vault-id))
       (updated-vault (merge vault {
          collateral: u0,
          debt: u0,
          updated-at-block-height: block-height
        })))
    (asserts! (is-eq u0 (get stacked-tokens vault)) (err ERR-STACKING-IN-PROGRESS))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))

    (try! (contract-call? .arkadiko-dao burn-token .xusd-token (get debt vault) (get owner vault)))
    (try! (contract-call? reserve burn ft (get owner vault) (get collateral vault)))
    (try! (contract-call? .arkadiko-collateral-types-v1-1 subtract-debt-from-collateral-type (get collateral-type vault) (get debt vault)))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 remove-collateral (get collateral vault) (get owner vault)))
    (print { type: "vault", action: "burn", data: updated-vault })
    (try! (contract-call? .arkadiko-vault-data-v1-1 close-vault vault-id))
    (ok true)
  )
)

(define-private (burn-partial-debt (vault-id uint) (debt uint) (reserve <vault-trait>) (ft <mock-ft-trait>))
  (let ((vault (get-vault-by-id vault-id)))
    (try! (contract-call? .arkadiko-dao burn-token .xusd-token debt (get owner vault)))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        debt: (- (get debt vault) debt),
        updated-at-block-height: block-height
      }))
    )
    (ok true)
  )
)

(define-read-only (get-stability-fee-for-vault (vault-id uint))
  (let (
    (vault (get-vault-by-id vault-id))
    (number-of-blocks (- block-height (get stability-fee-last-accrued vault)))
    (fee (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-stability-fee (get collateral-type vault))))
    (decimals (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-stability-fee-decimals (get collateral-type vault))))
    (interest (/ (* (get debt vault) fee) (pow u10 decimals)))
  )
    (ok (* number-of-blocks interest))
  )
)

(define-public (accrue-stability-fee (vault-id uint))
  (let (
    (vault (get-vault-by-id vault-id))
  )
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        updated-at-block-height: block-height,
        stability-fee-accrued: (unwrap-panic (get-stability-fee-for-vault vault-id)),
        stability-fee-last-accrued: block-height
      }))
    )
    (ok true)
  )
)

(define-public (pay-stability-fee (vault-id uint))
  (let (
    (vault (get-vault-by-id vault-id))
    (fee (+ (get stability-fee-accrued vault) (unwrap-panic (get-stability-fee-for-vault vault-id))))
  )
    (if (> fee u0)
      (begin
        (try! (contract-call? .xusd-token transfer fee tx-sender (as-contract tx-sender)))
        (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
            updated-at-block-height: block-height,
            stability-fee-accrued: u0,
            stability-fee-last-accrued: block-height
          }))
        )
        (ok true)
      )
      (ok true)
    )
  )
)

(define-public (liquidate (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq contract-caller .arkadiko-liquidator-v1-1) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? .arkadiko-vault-rewards-v1-1 claim-pending-rewards-liquidated-vault (get owner vault)))
    (let (
      (collateral (get collateral vault))
      (liquidation-penalty (unwrap-panic (contract-call? .arkadiko-collateral-types-v1-1 get-liquidation-penalty (get collateral-type vault))))
      (fee (unwrap-panic (get-stability-fee-for-vault vault-id)))
      (penalty (/ (* liquidation-penalty (+ fee (get debt vault))) u10000))
      (extra-debt (/ (* u60 penalty) u100)) ;; 60% of the penalty is extra debt.
      (discount (/ (* u40 liquidation-penalty) u10000)) ;; 40% of liquidation penalty is discount % for liquidator
    )
      (if
        (and
          (is-eq "STX" (get collateral-token vault))
          (> (get stacked-tokens vault) u0)
        )
        (begin
          ;; mint xSTX and sell those until stacking cycle ends
          (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
              collateral: u0,
              collateral-token: "xSTX",
              updated-at-block-height: block-height,
              is-liquidated: true,
              auction-ended: false,
              leftover-collateral: u0
            }))
          )
          (try! (contract-call? .arkadiko-sip10-reserve-v1-1 mint-xstx collateral))
          (ok (tuple (ustx-amount collateral) (extra-debt extra-debt) (vault-debt (get debt vault)) (discount discount)))
        )
        (begin
          (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
              collateral: u0,
              updated-at-block-height: block-height,
              is-liquidated: true,
              auction-ended: false,
              leftover-collateral: u0
            }))
          )
          (ok (tuple (ustx-amount collateral) (extra-debt extra-debt) (vault-debt (get debt vault)) (discount discount)))
        )
      )
    )
  )
)

(define-public (finalize-liquidation (vault-id uint) (leftover-collateral uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "auction-engine"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) true) (err ERR-VAULT-NOT-LIQUIDATED))

    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        collateral: u0,
        updated-at-block-height: block-height,
        auction-ended: true,
        leftover-collateral: leftover-collateral
      }))
    )
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 remove-collateral (get collateral vault) (get owner vault)))
    (try! (contract-call? .arkadiko-collateral-types-v1-1 subtract-debt-from-collateral-type (get collateral-type vault) (get debt vault)))
    (ok true)
  )
)

(define-public (redeem-auction-collateral (ft <mock-ft-trait>) (token-string (string-ascii 12)) (reserve <vault-trait>) (collateral-amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "auction-engine"))) (err ERR-NOT-AUTHORIZED))
    (contract-call? reserve redeem-collateral ft token-string collateral-amount sender)
  )
)

(define-public (withdraw-leftover-collateral (vault-id uint) (reserve <vault-trait>) (ft <mock-ft-trait>))
  (let (
    (vault (get-vault-by-id vault-id))
    (collateral-token (unwrap-panic (get-collateral-token-for-vault vault-id)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq true (get is-liquidated vault)) (err ERR-VAULT-NOT-LIQUIDATED))
    (asserts! (is-eq true (get auction-ended vault)) (err ERR-AUCTION-NOT-ENDED))

    (if (unwrap-panic (contract-call? reserve withdraw ft collateral-token (get owner vault) (get leftover-collateral vault)))
      (begin
        (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
            updated-at-block-height: block-height,
            leftover-collateral: u0
          }))
        )
        (ok true)
      )
      (err ERR-WITHDRAW-FAILED)
    )
  )
)


;; ---------------------------------------------------------
;; Admin Functions
;; ---------------------------------------------------------

(define-read-only (get-xusd-balance)
  (contract-call? .xusd-token get-balance-of (as-contract tx-sender))
)

(define-read-only (get-diko-balance)
  (contract-call? .arkadiko-token get-balance-of (as-contract tx-sender))
)

;; redeem xUSD and DIKO working capital for the foundation
;; taken from stability fees paid by vault owners
(define-public (redeem-tokens (xusd-amount uint) (diko-amount uint))
  (begin
    (asserts! (> (- block-height (var-get block-height-last-paid)) (* BLOCKS-PER-DAY u31)) (err ERR-NOT-AUTHORIZED))

    (var-set block-height-last-paid block-height)

    (if (and (> xusd-amount u0) (> diko-amount u0))
      (begin
        (try! (contract-call? .arkadiko-token transfer diko-amount (as-contract tx-sender) (contract-call? .arkadiko-dao get-payout-address)))
        (contract-call? .xusd-token transfer xusd-amount (as-contract tx-sender) (contract-call? .arkadiko-dao get-payout-address))
      )
      (if (> xusd-amount u0)
        (contract-call? .xusd-token transfer xusd-amount (as-contract tx-sender) (contract-call? .arkadiko-dao get-payout-address))
        (contract-call? .arkadiko-token transfer diko-amount (as-contract tx-sender) (contract-call? .arkadiko-dao get-payout-address))
      )
    )
  )
)

;; this should be called when upgrading contracts
;; freddie should only contain xUSD
(define-public (migrate-funds (new-vault-manager <vault-manager-trait>) (token <mock-ft-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (let (
      (balance (unwrap-panic (contract-call? token get-balance-of (as-contract tx-sender))))
    )
      (contract-call? token transfer balance (as-contract tx-sender) (contract-of new-vault-manager))
    )
  )
)

(define-public (set-stx-redeemable (new-stx-redeemable uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set stx-redeemable new-stx-redeemable)
    (ok true)
  )
)

(define-public (set-block-height-last-paid (new-block-height-last-paid uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set block-height-last-paid new-block-height-last-paid)
    (ok true)
  )
)

(define-public (set-maximum-debt-surplus (new-maximum-debt-surplus uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set maximum-debt-surplus new-maximum-debt-surplus)
    (ok true)
  )
)

;; migrates stx-redeemable, block-height-last-paid and maximum-debt-surplus
;; payout address has a separate setter that can be configured
(define-public (migrate-state (new-vault-manager <vault-manager-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? new-vault-manager set-stx-redeemable (var-get stx-redeemable)))
    (try! (contract-call? new-vault-manager set-block-height-last-paid (var-get block-height-last-paid)))
    (try! (contract-call? new-vault-manager set-maximum-debt-surplus (var-get maximum-debt-surplus)))
    (ok true)
  )
)
