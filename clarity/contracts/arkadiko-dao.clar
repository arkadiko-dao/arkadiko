(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait dao-token-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

;; Arkadiko DAO 
;; 
;; Keep contracts used in protocol. 
;; Emergency switch to shut down protocol.


;; Errors
(define-constant ERR-NOT-AUTHORIZED u100401)

;; Contract addresses
(define-map contracts
  { name: (string-ascii 256) }
  {
    address: principal, ;; e.g. 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
    qualified-name: principal ;; e.g. 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.freddie
  }
)
(define-map contracts-data
  { qualified-name: principal }
  {
    can-mint: bool,
    can-burn: bool
  }
)

;; Variables
(define-data-var emergency-shutdown-activated bool false)
(define-data-var dao-owner principal tx-sender)
(define-data-var payout-address principal (var-get dao-owner)) ;; to which address the foundation is paid
(define-data-var guardian principal (var-get dao-owner)) ;; guardian that can be set

(define-read-only (get-dao-owner)
  (var-get dao-owner)
)

(define-read-only (get-payout-address)
  (var-get payout-address)
)

(define-public (set-dao-owner (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set dao-owner address))
  )
)

(define-public (set-payout-address (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set payout-address address))
  )
)

(define-read-only (get-guardian-address)
  (var-get guardian)
)

(define-public (set-guardian-address (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get guardian)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set guardian address))
  )
)

(define-public (toggle-emergency-shutdown)
  (begin
    (asserts! (is-eq tx-sender (var-get guardian)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set emergency-shutdown-activated (not (var-get emergency-shutdown-activated))))
  )
)

(define-read-only (get-emergency-shutdown-activated)
  (ok (var-get emergency-shutdown-activated))
)

;; Get contract address
(define-read-only (get-contract-address-by-name (name (string-ascii 256)))
  (get address (map-get? contracts { name: name }))
)

;; Get contract qualified name
(define-read-only (get-qualified-name-by-name (name (string-ascii 256)))
  (get qualified-name (map-get? contracts { name: name }))
)

;; Check if contract can mint
(define-read-only (get-contract-can-mint-by-qualified-name (qualified-name principal))
  (default-to 
    false
    (get can-mint (map-get? contracts-data { qualified-name: qualified-name }))
  )
)

;; Check if contract can burn
(define-read-only (get-contract-can-burn-by-qualified-name (qualified-name principal))
  (default-to 
    false
    (get can-burn (map-get? contracts-data { qualified-name: qualified-name }))
  )
)

;; Governance contract can setup DAO contracts
(define-public (set-contract-address (name (string-ascii 256)) (address principal) (qualified-name principal) (can-mint bool) (can-burn bool))
  (let (
    (current-contract (map-get? contracts { name: name }))
  )
    (begin
      (asserts! (is-eq (unwrap-panic (get-qualified-name-by-name "governance")) contract-caller) (err ERR-NOT-AUTHORIZED))

      (map-set contracts { name: name } { address: address, qualified-name: qualified-name })
      (if (is-some current-contract)
        (map-set contracts-data { qualified-name: (unwrap-panic (get qualified-name current-contract)) } { can-mint: false, can-burn: false })
        false
      )
      (map-set contracts-data { qualified-name: qualified-name } { can-mint: can-mint, can-burn: can-burn })
      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; Protocol tokens
;; ---------------------------------------------------------

;; Mint protocol tokens
(define-public (mint-token (token <dao-token-trait>) (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq (get-contract-can-mint-by-qualified-name contract-caller) true) (err ERR-NOT-AUTHORIZED))
    (print { type: "token", action: "minted", data: { amount: amount, recipient: recipient } })
    (contract-call? token mint-for-dao amount recipient)
  )
)

;; Burn protocol tokens
(define-public (burn-token (token <dao-token-trait>) (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq (get-contract-can-burn-by-qualified-name contract-caller) true) (err ERR-NOT-AUTHORIZED))
    (print { type: "token", action: "burned", data: { amount: amount, recipient: recipient } })
    (contract-call? token burn-for-dao amount recipient)
  )
)

;; This method is called by the auction engine when more bad debt needs to be burned
;; but the vault collateral is not sufficient
;; As a result, additional DIKO will be minted to cover bad debt
(define-public (request-diko-tokens (collateral-amount uint))
  (begin
    (asserts! (is-eq (unwrap-panic (get-qualified-name-by-name "auction-engine")) contract-caller) (err ERR-NOT-AUTHORIZED))

    (contract-call? .arkadiko-token mint-for-dao collateral-amount (as-contract (unwrap-panic (get-qualified-name-by-name "sip10-reserve"))))
  )
)


;; ---------------------------------------------------------
;; Contract initialisation
;; ---------------------------------------------------------

;; Initialize the contract
(begin
  ;; Add initial contracts
  (map-set contracts
    { name: "freddie" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-freddie-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "auction-engine" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v4-5
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v4-5 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "oracle" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-oracle-v2-3
    }
  )
  (map-set contracts
    { name: "collateral-types" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-collateral-types-v3-1
    }
  )
  (map-set contracts
    { name: "governance" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-governance-v4-3
    }
  )
  (map-set contracts
    { name: "stake-registry" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v2-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v2-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "stake-pool-diko" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v2-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v2-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "stake-pool-diko-usda" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-usda-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-usda-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "stake-pool-wstx-usda" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-wstx-usda-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-wstx-usda-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "stake-pool-wstx-diko" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-wstx-diko-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-wstx-diko-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "stacker" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stacker-v3-1
    }
  )
  (map-set contracts
    { name: "stacker-2" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stacker-2-v1-1
    }
  )
  (map-set contracts
    { name: "stacker-3" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stacker-3-v1-1
    }
  )
  (map-set contracts
    { name: "stacker-4" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stacker-4-v1-1
    }
  )

  (map-set contracts
    { name: "stacker-payer" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stacker-payer-v3-8
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stacker-payer-v3-8 }
    {
      can-mint: false,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "stx-reserve" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stx-reserve-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "sip10-reserve-v1-1" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "sip10-reserve" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v2-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-sip10-reserve-v2-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "diko-guardian" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-diko-guardian-v3-1
    }
  )

  (map-set contracts
    { name: "diko-init" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-diko-init-v2-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-diko-init-v2-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vault-rewards" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vault-rewards-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vault-rewards-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "swap" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-swap-v2-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-swap-v2-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "liquidator" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v4-5
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-auction-engine-v4-5 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "liquidation-rewards-diko" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-liquidation-rewards-diko-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-liquidation-rewards-diko-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "liquidation-rewards" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-liquidation-rewards-v1-2
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-liquidation-rewards-v1-2 }
    {
      can-mint: false,
      can-burn: false
    }
  )

  (map-set contracts
    { name: "liquidation-pool" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-liquidation-pool-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-liquidation-pool-v1-1 }
    {
      can-mint: false,
      can-burn: false
    }
  )

  (map-set contracts
    { name: "vaults-manager" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-manager-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-manager-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-operations" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-operations-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-operations-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-pool-liq" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-pool-liq-v1-2
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-pool-liq-v1-2 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-pool-active" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-pool-active-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-pool-active-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-tokens" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-tokens-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-tokens-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-sorted" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-sorted-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-sorted-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-data" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-data-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-data-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-helpers" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-helpers-v1-1
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-helpers-v1-1 }
    {
      can-mint: true,
      can-burn: true
    }
  )

  (map-set contracts
    { name: "vaults-migration" }
    {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
      qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-migration-v1-3
    }
  )
  (map-set contracts-data
    { qualified-name: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-vaults-migration-v1-3 }
    {
      can-mint: true,
      can-burn: true
    }
  )
)
