;; @contract Freddie - The Vault Manager
;; Freddie is an abstraction layer that interacts with collateral type reserves
;; Ideally, collateral reserves should never be called from outside. Only manager layers (such as this one) should be interacted with from clients
;; @version 1

(impl-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-manager-trait .arkadiko-vault-manager-trait-v1.vault-manager-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

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
(define-data-var maximum-debt-surplus uint u10000000000000) ;; 10 million default - above that we sell the USDA on the DIKO/USDA pair to burn DIKO
(define-map stacking-unlock-burn-height
  { stacker-name: (string-ascii 256) }
  {
    height: uint
  }
)
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
  (ok (var-set stx-redeemable (- (var-get stx-redeemable) token-amount)))
)

(define-read-only (get-stacking-unlock-burn-height (name (string-ascii 256)))
  (ok (get height (unwrap-panic (map-get? stacking-unlock-burn-height { stacker-name: name }))))
)

;; @desc sets the block height at which STX tokens unlock from PoX
;; @param name; name of the stacker contract that is stacking the STX tokens
;; @param burn-height; the block height of the burnchain (i.e. Bitcoin) for when the tokens unlock
;; @post boolean; returns a boolean indicating successfully set or not
(define-public (set-stacking-unlock-burn-height (name (string-ascii 256)) (burn-height uint))
  (begin
    (asserts! 
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (ok (map-set stacking-unlock-burn-height { stacker-name: name } { height: burn-height }))
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

;; @desc calculate the collateralization (in other words collateral to debt) ratio for a vault
;; @param vault-id; the ID of the vault to calculate the current collateralization ratio for
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @param oracle; the oracle implementation that provides the on-chain price
;; @param include-stability-fees; boolean to indicate whether to include stability fees as part of debt calculation
;; @post uint; returns the collateralization ratio
(define-public (calculate-current-collateral-to-debt-ratio
  (vault-id uint)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
  (include-stability-fees bool)
)
  (let ((vault (get-vault-by-id vault-id)))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))

    (if (is-eq (get is-liquidated vault) true)
      (ok u0)
      (begin
        (let ((price (unwrap-panic (contract-call? oracle fetch-price (get collateral-token vault)))))
          (ok
            (/
              (/
                (* (get collateral vault) (get last-price price))
                (+
                  (get debt vault)
                  (if include-stability-fees
                    (unwrap-panic (stability-fee-helper (get stability-fee-last-accrued vault) (get debt vault) (get collateral-type vault) coll-type))
                    u0
                  )
                )
              )
              (/ (get decimals price) u100)
            )
          )
        )
      )
    )
  )
)

(define-private (resolve-stacking-amount (collateral-amount uint) (collateral-token (string-ascii 12)) (stack-pox bool))
  (if (and (is-eq collateral-token "STX") stack-pox)
    collateral-amount
    u0
  )
)

;; @desc can be called by the vault owner on a non-liquidated STX vault
;; used to indicate willingness to stack/unstack the collateral in the PoX contract
;; @param vault-id; the ID of the vault to toggle the stacking in PoX for
;; @post bool; returns true if stacking was toggled
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
    (try! (contract-call? .arkadiko-stx-reserve-v1-1 toggle-stacking (get stacker-name vault) (not (get revoked-stacking vault)) (get collateral vault)))

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

    (try! (contract-call? .arkadiko-stx-reserve-v1-1 add-tokens-to-stack (get stacker-name vault) (get collateral vault)))
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

;; method that can only be called by deployer (contract owner)
;; unlocks STX that had their xSTX derivative liquidated in an auction
(define-public (release-stacked-stx (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq "xSTX" (get collateral-token vault)) (err ERR-WRONG-COLLATERAL-TOKEN))
    (asserts! (is-eq true (get is-liquidated vault)) (err ERR-VAULT-LIQUIDATED))
    (asserts! (> (get stacked-tokens vault) u0) (err ERR-STACKING-IN-PROGRESS))
    (asserts!
      (>=
        burn-block-height
        (get height (unwrap-panic (map-get? stacking-unlock-burn-height { stacker-name: (get stacker-name vault) })))
      )
      (err ERR-BURN-HEIGHT-NOT-REACHED)
    )

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
        (unwrap-panic (subtract-stx-redeemable (min-of stx ustx-amount)))
        (ok true)
      )
      (ok false)
    )
  )
)

(define-public (toggle-freddie-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set freddie-shutdown-activated (not (var-get freddie-shutdown-activated))))
  )
)


;; @desc creates a vault with collateral and a certain debt level
;; @param collateral-amount; the micro-amount (10^-6) of collateral (STX or sip10) that will be deposited in a vault
;; @param debt; the micro-amount (10^-6) of debt that will be minted against the collateral
;; @param pox-settings; if STX is the collateral, this indicates whether the collateral will be stacked and if the yield is used to pay off the debt automatically
;; @param collateral-type; indicates the collateral type that is used in the vault (e.g. STX-A)
;; @param reserve; indicates the reserve that will keep custody of the token (e.g. stx-reserve or sip10-reserve)
;; @param ft; indicates the sip10 fungible token that is used as collateral
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @param oracle; contract that contains the on-chain price of the collateral
;; @post vault; a new vault is created for the tx-sender
(define-public (collateralize-and-mint
  (collateral-amount uint)
  (debt uint)
  (pox-settings (tuple (stack-pox bool) (auto-payoff bool)))
  (collateral-type (string-ascii 12))
  (reserve <vault-trait>)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
)
  (let (
    (sender tx-sender)
    (collateral-type-object (unwrap-panic (contract-call? coll-type get-collateral-type-by-name collateral-type)))
    (collateral-token (get token collateral-type-object))
    (ratio (unwrap! (contract-call? reserve calculate-current-collateral-to-debt-ratio collateral-token debt collateral-amount oracle) (err ERR-WRONG-DEBT)))
    (stacker-name (contract-call? .arkadiko-stx-reserve-v1-1 get-next-stacker-name))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (asserts! (>= ratio (get collateral-to-debt-ratio collateral-type-object)) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts!
      (<=
        (+ debt (get total-debt collateral-type-object))
        (get maximum-debt collateral-type-object)
      )
      (err ERR-MAXIMUM-DEBT-REACHED)
    )
    (asserts!
      (or
        (is-eq collateral-token "STX")
        (is-eq (get token-address collateral-type-object) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (try! (contract-call? reserve collateralize-and-mint ft collateral-token collateral-amount debt sender stacker-name (get stack-pox pox-settings)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token debt sender)))
    (let (
      (vault-id (+ (contract-call? .arkadiko-vault-data-v1-1 get-last-vault-id) u1))
      (vault {
        id: vault-id,
        owner: sender,
        collateral: collateral-amount,
        collateral-type: collateral-type,
        collateral-token: collateral-token,
        stacked-tokens: (resolve-stacking-amount collateral-amount collateral-token (get stack-pox pox-settings)),
        stacker-name: stacker-name,
        revoked-stacking: (not (get stack-pox pox-settings)),
        auto-payoff: (get auto-payoff pox-settings),
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
      (try! (contract-call? coll-type add-debt-to-collateral-type collateral-type debt))
      (print { type: "vault", action: "created", data: vault })
      (ok debt)
    )
  )
)

;; @desc deposit extra collateral in a vault
;; @param vault-id; the ID of the vault to deposit additional collateral in
;; @param uamount; the micro-amount (10^-6) of collateral that will be deposited
;; @param reserve; indicates the reserve that will keep custody of the token (e.g. stx-reserve or sip10-reserve)
;; @param ft; indicates the sip10 fungible token that is used as collateral
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post true; returns true when additional collateral was added successfully
(define-public (deposit
  (vault-id uint)
  (uamount uint)
  (reserve <vault-trait>)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
)
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
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq collateral-token "STX")
        (is-eq (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (unwrap! (contract-call? reserve deposit ft collateral-token uamount (get stacker-name vault)) (err ERR-DEPOSIT-FAILED))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 add-collateral uamount (get owner vault)))
    (print { type: "vault", action: "deposit", data: updated-vault })
    (ok true)
  )
)

;; @desc withdraw collateral from a vault
;; @param vault-id; the ID of the vault to withdraw collateral from
;; @param uamount; the micro-amount (10^-6) of collateral that will be withdrawn
;; @param reserve; indicates the reserve that keeps custody of your collateral (e.g. stx-reserve or sip10-reserve)
;; @param ft; indicates the sip10 fungible token that is used as collateral
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @param oracle; the oracle implementation that provides the on-chain price
;; @post true; returns true when collateral was withdrawn successfully
(define-public (withdraw
  (vault-id uint)
  (uamount uint)
  (reserve <vault-trait>)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
)
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
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> uamount u0) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts! (<= uamount (get collateral vault)) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts! (is-eq u0 (get stacked-tokens vault)) (err ERR-STACKING-IN-PROGRESS))
    (asserts!
      (or
        (is-eq collateral-token "STX")
        (is-eq (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (let ((ratio (unwrap-panic 
            (contract-call? 
              reserve 
              calculate-current-collateral-to-debt-ratio 
              (get collateral-token vault) 
              (get debt vault) 
              (- (get collateral vault) uamount)
              oracle
            )
          ))
          (new-collateral (- (get collateral vault) uamount))
          (updated-vault (merge vault {
            collateral: new-collateral,
            updated-at-block-height: block-height
          })))
      (asserts! (>= ratio (unwrap-panic (contract-call? coll-type get-collateral-to-debt-ratio (get collateral-type vault)))) (err ERR-INSUFFICIENT-COLLATERAL))
      (unwrap! (contract-call? reserve withdraw ft collateral-token (get owner vault) uamount) (err ERR-WITHDRAW-FAILED))
      (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
      (try! (contract-call? .arkadiko-vault-rewards-v1-1 remove-collateral uamount (get owner vault)))
      (print { type: "vault", action: "withdraw", data: updated-vault })
      (ok true)
    )
  )
)

;; @desc mint extra USDA in a vault
;; @param vault-id; the ID of the vault to mint extra USDA for
;; @param extra-debt; the micro-amount (10^-6) of extra USDA that will be minted
;; @param reserve; indicates the reserve that keeps custody of your collateral (e.g. stx-reserve or sip10-reserve)
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @param oracle; the oracle implementation that provides the on-chain price
;; @post true; returns true when extra USDA was minted successfully
(define-public (mint
  (vault-id uint)
  (extra-debt uint)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
  (oracle <oracle-trait>)
)
  (let (
    (vault (get-vault-by-id vault-id))
    (new-total-debt (+ extra-debt (get debt vault)))
    (updated-vault (merge vault {
      debt: new-total-debt,
      updated-at-block-height: block-height
    }))
    (collateral-type (unwrap-panic (contract-call? coll-type get-collateral-type-by-name (get collateral-type vault))))
    (ratio
      (unwrap!
        (contract-call? reserve calculate-current-collateral-to-debt-ratio
          (get collateral-token vault)
          new-total-debt
          (get collateral vault)
          oracle
        )
        (err ERR-WRONG-DEBT)
      )
    )
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts! (>= ratio (get collateral-to-debt-ratio collateral-type)) (err ERR-INSUFFICIENT-COLLATERAL))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (<=
        (+ extra-debt (get total-debt collateral-type))
        (get maximum-debt collateral-type)
      )
      (err ERR-MAXIMUM-DEBT-REACHED)
    )

    ;; save how much stability fees the person owes up to that point
    (try! (accrue-stability-fee vault-id coll-type))
    (try! (contract-call? reserve mint
        (get collateral-token vault)
        (get owner vault)
        (get collateral vault)
        (get debt vault)
        extra-debt
        (get collateral-to-debt-ratio collateral-type)
        oracle
      )
    )
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
    (try! (contract-call? coll-type add-debt-to-collateral-type (get collateral-type vault) extra-debt))
    (print { type: "vault", action: "mint", data: updated-vault })
    (ok true)
  )
)

;; @desc burn USDA from a vault
;; @param vault-id; the ID of the vault to burn USDA from
;; @param debt; the micro-amount (10^-6) of USDA that will be burned
;; @param reserve; indicates the reserve that keeps custody of your collateral (e.g. stx-reserve or sip10-reserve)
;; @param ft; indicates the sip10 fungible token that is used as collateral
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post true; returns true when USDA was burned successfully
(define-public (burn
  (vault-id uint)
  (debt uint)
  (reserve <vault-trait>)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
)
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts!
      (or
        (is-eq (get collateral-token vault) "STX")
        (is-eq (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (try! (pay-stability-fee vault-id coll-type))
    (print { type: "vault", action: "burn", data: vault })
    (burn-partial-debt vault-id (min-of debt (get debt vault)) ft coll-type)
  )
)

(define-public (close-vault
  (vault-id uint)
  (reserve <vault-trait>)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
)
  (let ((vault (get-vault-by-id vault-id))
       (updated-vault (merge vault {
          collateral: u0,
          debt: u0,
          updated-at-block-height: block-height
        })))
    (asserts! (is-eq u0 (get stacked-tokens vault)) (err ERR-STACKING-IN-PROGRESS))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-liquidated vault) false) (err ERR-VAULT-LIQUIDATED))
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts!
      (or
        (is-eq (get collateral-token vault) "STX")
        (is-eq (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (if (is-eq (get debt vault) u0)
      true
      (try! (contract-call? .arkadiko-dao burn-token .usda-token (get debt vault) (get owner vault)))
    )
    (try! (contract-call? reserve burn ft (get owner vault) (get collateral vault)))
    (try! (contract-call? coll-type subtract-debt-from-collateral-type (get collateral-type vault) (get debt vault)))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id updated-vault))
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 remove-collateral (get collateral vault) (get owner vault)))
    (print { type: "vault", action: "close", data: updated-vault })
    (try! (contract-call? .arkadiko-vault-data-v1-1 close-vault vault-id))
    (ok true)
  )
)

(define-private (burn-partial-debt
  (vault-id uint)
  (debt uint)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
)
  (let ((vault (get-vault-by-id vault-id)))
    (try! (contract-call? .arkadiko-dao burn-token .usda-token debt tx-sender))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        debt: (- (get debt vault) debt),
        updated-at-block-height: block-height
      }))
    )
    (try! (contract-call? coll-type subtract-debt-from-collateral-type (get collateral-type vault) debt))
    (ok true)
  )
)

;; @desc get the stability fee (interest to be paid) for a vault
;; @param vault-id; the ID of the vault to return the stability fee for
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post uint; returns uint, which is the stability fee
(define-public (get-stability-fee-for-vault
  (vault-id uint)
  (coll-type <collateral-types-trait>)
)
  (let (
    (vault (get-vault-by-id vault-id))
  )
    (stability-fee-helper (get stability-fee-last-accrued vault) (get debt vault) (get collateral-type vault) coll-type)
  )
)

(define-private (stability-fee-helper
  (stability-fee-last-accrued uint)
  (debt uint)
  (collateral-type-string (string-ascii 12))
  (coll-type <collateral-types-trait>)
)
  (let (
    (number-of-blocks (- block-height stability-fee-last-accrued))
    (collateral-type (unwrap-panic (contract-call? coll-type get-collateral-type-by-name collateral-type-string)))
    (fee (get stability-fee collateral-type))
    (decimals (get stability-fee-decimals collateral-type))
    (interest (/ (* debt fee) (pow u10 decimals)))
  )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (ok (* number-of-blocks interest))
  )
)

;; @desc accrue the stability fee up until now on a vault
;; this method should be called when the stability fee on a collateral type is changed through governance
;; meaning you want to lock in (accrue) all the stability fees for that stability fee percentage up until the block that it changes
;; @param vault-id; the ID of the vault to accrue the stability fee for
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post true; returns true when stability fee was accrued successfully
(define-public (accrue-stability-fee
  (vault-id uint)
  (coll-type <collateral-types-trait>)
)
  (let (
    (vault (get-vault-by-id vault-id))
  )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
        updated-at-block-height: block-height,
        stability-fee-accrued: (unwrap-panic (get-stability-fee-for-vault vault-id coll-type)),
        stability-fee-last-accrued: block-height
      }))
    )
    (ok true)
  )
)

;; @desc pay the stability fee up until now for a vault
;; @param vault-id; the ID of the vault to pay the stability fee for
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post uint; returns the amount paid when the stability fee was paid successfully
(define-public (pay-stability-fee
  (vault-id uint)
  (coll-type <collateral-types-trait>)
)
  (let (
    (vault (get-vault-by-id vault-id))
    (fee (+ (get stability-fee-accrued vault) (unwrap-panic (get-stability-fee-for-vault vault-id coll-type))))
  )
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (if (> fee u0)
      (begin
        (try! (contract-call? .usda-token transfer fee tx-sender (as-contract tx-sender) none))
        (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
            updated-at-block-height: block-height,
            stability-fee-accrued: u0,
            stability-fee-last-accrued: block-height
          }))
        )
        (ok fee)
      )
      (ok fee)
    )
  )
)

;; @desc liquidates a vault
;; only callable by the liquidator smart contract
;; the vault owner loses their potential (DIKO) vault rewards and collateral is sold off in an auction
;; @param vault-id; the ID of the vault to liquidate
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post tuple; returns a tuple with the amount in micro STX, extra debt (penalty) to be paid, the vault debt and a discount given to keepers in auctions
(define-public (liquidate
  (vault-id uint)
  (coll-type <collateral-types-trait>)
)
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get freddie-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidator"))) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? .arkadiko-vault-rewards-v1-1 claim-pending-rewards-liquidated-vault (get owner vault)))
    (try! (contract-call? .arkadiko-vault-rewards-v1-1 remove-collateral (get collateral vault) (get owner vault)))
    (let (
      (collateral (get collateral vault))
      (liquidation-penalty (unwrap-panic (contract-call? coll-type get-liquidation-penalty (get collateral-type vault))))
      (fee (unwrap-panic (get-stability-fee-for-vault vault-id coll-type)))
      (penalty (/ (* liquidation-penalty (+ fee (get debt vault))) u10000))
      (extra-debt (/ (* u30 penalty) u100)) ;; 30% of the penalty is extra debt.
      (discount (/ (* u70 liquidation-penalty) u10000)) ;; 70% of liquidation penalty is discount % for liquidator
    )
      (print { type: "vault", action: "liquidated", data: vault })
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

;; @desc finalises the vault liquidation after the vault's collateral got auctioned off
;; sets vault parameters such as leftover collateral
;; @param vault-id; the ID of the vault to liquidate
;; @param leftover-collateral; the micro-amount of collateral that is left after the auction ended
;; @param coll-type; contract that contains the collateral types that can be used for a vault
;; @post bool; returns true if liquidation got finalised successfully
(define-public (finalize-liquidation
  (vault-id uint)
  (leftover-collateral uint)
  (coll-type <collateral-types-trait>)
)
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
    (try! (contract-call? coll-type subtract-debt-from-collateral-type (get collateral-type vault) (get debt vault)))
    (ok true)
  )
)

;; @desc redeems a collateral amount for the bidder on a lot in an auction from the STX or SIP10 reserve
;; the collateral that is redeemed is part of a liquidated vault
;; @param ft; indicates the sip10 fungible token that is used as collateral
;; @param token-string; the name of the token that will be redeemed
;; @param reserve; indicates the reserve that keeps custody of the token (e.g. stx-reserve or sip10-reserve)
;; @param collateral-amount; the micro-amount of collateral that should be redeemed
;; @param sender; the sender, who is the owner of the winning lot, that wants to redeem the collateral
;; @post bool; returns true if redeem was succesful
(define-public (redeem-auction-collateral (ft <ft-trait>) (token-string (string-ascii 12)) (reserve <vault-trait>) (collateral-amount uint) (sender principal))
  (begin
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "auction-engine"))) (err ERR-NOT-AUTHORIZED))
    (contract-call? reserve redeem-collateral ft token-string collateral-amount sender)
  )
)

;; @desc withdraws collateral from a liquidated vault after an auction ended 
;; @param vault-id; the ID of the vault to withdraw collateral from
;; @param reserve; the reserve that stores the fungible tokens (collateral) that were sold off
;; @param ft; the fungible token that was sold off (either a SIP10 token or STX)
;; @param coll-type; the contract that implements the parameters of the collateral types compatible with Arkadiko vaults
;; @post bool; returns true if withdrawing leftover collateral was successful
(define-public (withdraw-leftover-collateral
  (vault-id uint)
  (reserve <vault-trait>)
  (ft <ft-trait>)
  (coll-type <collateral-types-trait>)
)
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
    (asserts!
      (or
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve")))
        (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "sip10-reserve")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq true (get is-liquidated vault)) (err ERR-VAULT-NOT-LIQUIDATED))
    (asserts! (is-eq true (get auction-ended vault)) (err ERR-AUCTION-NOT-ENDED))
    (asserts! (is-eq u0 (get stacked-tokens vault)) (err ERR-STACKING-IN-PROGRESS))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts!
      (or
        (is-eq collateral-token "xSTX")
        (is-eq (unwrap-panic (contract-call? coll-type get-token-address (get collateral-type vault))) (contract-of ft))
      )
      (err ERR-WRONG-COLLATERAL-TOKEN)
    )

    (try! (pay-stability-fee vault-id coll-type))
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

(define-read-only (get-usda-balance)
  (contract-call? .usda-token get-balance (as-contract tx-sender))
)

(define-read-only (get-diko-balance)
  (contract-call? .arkadiko-token get-balance (as-contract tx-sender))
)

;; @desc redeem USDA and DIKO working capital for the foundation
;; taken from stability fees paid by vault owners
;; @param usda-amount; the amount of USDA to withdraw from the contract
;; @param diko-amount; the amount of DIKO to withdraw from the contract
;; @post usda; usda-amount will be transferred from the contract to the DAO payout address
;; @post diko; diko-amount will be transferred from the contract to the DAO payout address
(define-public (redeem-tokens (usda-amount uint) (diko-amount uint))
  (begin
    (asserts! (> (- block-height (var-get block-height-last-paid)) (* BLOCKS-PER-DAY u31)) (err ERR-NOT-AUTHORIZED))

    (var-set block-height-last-paid block-height)

    (if (and (> usda-amount u0) (> diko-amount u0))
      (begin
        (try! (as-contract (contract-call? .arkadiko-token transfer diko-amount tx-sender (contract-call? .arkadiko-dao get-payout-address) none)))
        (as-contract (contract-call? .usda-token transfer usda-amount tx-sender (contract-call? .arkadiko-dao get-payout-address) none))
      )
      (if (> usda-amount u0)
        (as-contract (contract-call? .usda-token transfer usda-amount tx-sender (contract-call? .arkadiko-dao get-payout-address) none))
        (as-contract (contract-call? .arkadiko-token transfer diko-amount tx-sender (contract-call? .arkadiko-dao get-payout-address) none))
      )
    )
  )
)

;; @desc should be called when upgrading contracts
;; freddie should only contain USDA
;; @param new-vault-manager; the new vault contract to migrate funds to
;; @param token; indicates the fungible token that the contract should be migrate funds of
;; @post token; all token amounts will be transferred to the new contract
;; @post bool; returns true if transfer was successful
(define-public (migrate-funds (new-vault-manager <vault-manager-trait>) (token <ft-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (let (
      (balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
    )
      (as-contract (contract-call? token transfer balance tx-sender (contract-of new-vault-manager) none))
    )
  )
)

;; @desc sets the amount of STX that is redeemable for xSTX (the derivative that is sold off in an auction)
;; @param new-stx-redeemable; the micro-amount of xSTX redeemable for STX
;; @post bool; returns true if setting the variable was successful
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

;; initialization
(map-set stacking-unlock-burn-height { stacker-name: "stacker" } { height: u0 })
(map-set stacking-unlock-burn-height { stacker-name: "stacker-2" } { height: u0 })
(map-set stacking-unlock-burn-height { stacker-name: "stacker-3" } { height: u0 })
(map-set stacking-unlock-burn-height { stacker-name: "stacker-4" } { height: u0 })
