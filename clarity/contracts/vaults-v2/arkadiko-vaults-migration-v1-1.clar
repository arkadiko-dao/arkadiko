;; Vaults Migration 
;; Migrate V1 to V2
;;
;; Vaults system V1 is stopped, after which the data is stored off chain.
;; Data is added to V2 via this contract.
;;

(impl-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u990401)
(define-constant ERR_MIGRATE_FAILED u990001)
(define-constant ERR_NO_OPEN_VAULT u990002)

;; ---------------------------------------------------------
;; Vaults
;; ---------------------------------------------------------

(define-public (migrate-vaults
  (vaults (list 200 { 
    owner: principal, 
    token: principal, 
    status: uint, 
    collateral: uint, 
    debt: uint, 
    prev-owner-hint: (optional principal) 
  }))
)
  (let (
    (migrate-result (map migrate-vault-iter vaults))
  )
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))
    (asserts! (is-none (index-of? migrate-result (ok false))) (err ERR_MIGRATE_FAILED))

    (print { migrate-result: migrate-result })
    (ok true)
  )
)

(define-private (migrate-vault-iter
  (vaultInfo { 
    owner: principal, 
    token: principal, 
    status: uint, 
    collateral: uint, 
    debt: uint, 
    prev-owner-hint: (optional principal) 
  })
)
  (let (
    (owner (get owner vaultInfo))
    (token (get token vaultInfo))
    (status (get status vaultInfo))
    (collateral (get collateral vaultInfo))
    (debt (get debt vaultInfo))
    (prev-owner-hint (get prev-owner-hint vaultInfo))

    (nicr (/ (* collateral u100000000) debt))
  )
    ;; Save vault data
    (unwrap! (contract-call? .arkadiko-vaults-data-v1-1 set-vault owner token status collateral debt) (ok false))
    (unwrap! (contract-call? .arkadiko-vaults-sorted-v1-1 insert owner token nicr prev-owner-hint) (ok false))

    (ok true)
  )
)

(define-public (migrate-to-ststx (prev-owner-hint (optional principal)))
  (let (
    ;; TODO: update for mainnet
    (stx-token 'ST17YH9X6E2JYS51CB8HA73FAHWWYMMYKEHB2E2HQ.wstx-token)
    (ststx-token 'ST17YH9X6E2JYS51CB8HA73FAHWWYMMYKEHB2E2HQ.ststx-token)

    (current-stx-vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault tx-sender stx-token))
    (current-ststx-vault (contract-call? .arkadiko-vaults-data-v1-1 get-vault tx-sender ststx-token))

    (stx-collateral (get collateral current-stx-vault))
    (debt (get debt current-stx-vault))
    (nicr (/ (* collateral u100000000) debt))
  )
    ;; Check if STX vault is open - else error
    (asserts! (is-eq (get status current-stx-vault) u101) (err ERR_NO_OPEN_VAULT))

    ;; mint stSTX
    (let (
      (new-ststx-amount (unwrap! (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v1 deposit
        'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1
        stx-collateral
        none) (err false))
      )
    )
      ;; Check if stSTX vault is open - if so migrate together
      (if (is-eq (get status current-ststx-vault) u101)
        (begin
          ;; already open vault, merge additional stSTX collateral and debt, close STX vault
          (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault tx-sender ststx-token u101 (+ (get collateral current-ststx-vault) new-ststx-amount) (+ (get debt current-ststx-vault) debt)))
        )
        (begin
          ;; new vault: create stSTX vault and close STX vault
          (try! (contract-call? .arkadiko-vaults-data-v1-1 set-vault tx-sender ststx-token u101 new-ststx-amount debt))
        )
      )
      (try! (contract-call? .arkadiko-vaults-sorted-v1-1 insert tx-sender ststx-token nicr prev-owner-hint))
      (try! (as-contract (contract-call? .arkadiko-vaults-data-v1-1 set-vault tx-sender (contract-of stx-token) STATUS_CLOSED_BY_OWNER u0 u0)))
      (try! (as-contract (contract-call? .arkadiko-vaults-sorted-v1-1 remove tx-sender (contract-of stx-token))))

      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; Pool Liq
;; ---------------------------------------------------------

(define-public (migrate-pool-liq-funds)
  (let (
    (usda-amount (unwrap-panic (contract-call? .usda-token get-balance .arkadiko-liquidation-pool-v1-1)))
  )
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token usda-amount .arkadiko-liquidation-pool-v1-1)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token usda-amount .arkadiko-vaults-pool-liq-v1-1)))

    (ok usda-amount)
  )
)

(define-public (migrate-pool-liq 
  (stakers (list 200 { 
    staker: principal, 
    amount: uint,
  }))
)
  (let (
    (migrate-result (map migrate-pool-liq-iter stakers))
  )
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))
    (asserts! (is-none (index-of? migrate-result (ok false))) (err ERR_MIGRATE_FAILED))

    (print { migrate-result: migrate-result })
    (ok true)
  )
)

(define-private (migrate-pool-liq-iter 
  (stakerInfo { 
    staker: principal, 
    amount: uint, 
  })
)
  (let (
    (staker (get staker stakerInfo))
    (amount (get amount stakerInfo))
  )
    ;; Save pool stake
    (unwrap! (contract-call? .arkadiko-vaults-pool-liq-v1-1 migrate-pool-liq staker amount) (ok false))

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Reserves
;; ---------------------------------------------------------

;; TODO: Update addresses for mainnet
(define-public (migrate-reserves (stx-amount-to-stack uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    ;; First we stack STX, to get stSTX
    (try! (as-contract (contract-call? .stacking-dao-core-v1 deposit 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1 stx-amount-to-stack none)))

    ;; Now that we have all needed tokens, transfer these to pool-active
    (let (
      (stx-balance (stx-get-balance (as-contract tx-sender)))
      (ststx-balance (unwrap-panic (contract-call? .ststx-token get-balance (as-contract tx-sender))))
      (wbtc-balance (unwrap-panic (contract-call? .Wrapped-Bitcoin get-balance (as-contract tx-sender))))
    )
      ;; Transfer tokens to pool-active
      (try! (as-contract (contract-call? .wstx-token transfer stx-balance tx-sender .arkadiko-vaults-pool-active-v1-1 none)))
      (try! (as-contract (contract-call? .ststx-token transfer ststx-balance tx-sender .arkadiko-vaults-pool-active-v1-1 none)))
      (try! (as-contract (contract-call? .Wrapped-Bitcoin transfer wbtc-balance tx-sender .arkadiko-vaults-pool-active-v1-1 none)))

      (ok { stx-balance: stx-balance, ststx-balance: ststx-balance, wbtc-balance: wbtc-balance})
    )
  )
)

;; In case something goes wrong
(define-public (withdraw-stx (amount uint) (receiver principal))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (as-contract (stx-transfer? amount tx-sender receiver))
  )
)

;; In case something goes wrong
(define-public (withdraw-sip10 (token <ft-trait>) (amount uint) (receiver principal))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (as-contract (contract-call? token transfer amount tx-sender receiver none))
  )
)

;; ---------------------------------------------------------
;; Vault Trait 
;; Need to pass <vault-trait> when migrating funds from reserve
;; So we can pass this contract, and use withdraw methods to get the tokens
;; ---------------------------------------------------------

(define-public (calculate-usda-count
  (token (string-ascii 12))
  (ustx-amount uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (ok u0)
)

(define-public (calculate-current-collateral-to-debt-ratio
  (token (string-ascii 12))
  (debt uint)
  (ustx uint)
  (oracle <oracle-trait>)
)
  (ok u0)
)

(define-public (collateralize-and-mint
  (token <ft-trait>)
  (token-string (string-ascii 12))
  (ustx-amount uint)
  (debt uint)
  (sender principal)
  (stacker-name (string-ascii 256))
  (stack-pox bool)
)
  (ok u0)
)

(define-public (deposit (token <ft-trait>) (token-string (string-ascii 12)) (additional-ustx-amount uint) (stacker-name (string-ascii 256)))
  (ok true)
)

;; withdraw collateral (e.g. if collateral goes up in value)
(define-public (withdraw (token <ft-trait>) (token-string (string-ascii 12)) (vault-owner principal) (ustx-amount uint))
  (ok true)
)

(define-public (mint
  (token-string (string-ascii 12))
  (vault-owner principal)
  (ustx-amount uint)
  (current-debt uint)
  (extra-debt uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (ok true)
)

;; burn stablecoin to free up STX tokens
;; method assumes position has not been liquidated
;; and thus collateral to debt ratio > liquidation ratio
(define-public (burn (token <ft-trait>) (vault-owner principal) (collateral-to-return uint))
  (ok true)
)

(define-public (redeem-collateral (token <ft-trait>) (token-string (string-ascii 12)) (stx-collateral uint) (owner principal))
  (ok true)
)

