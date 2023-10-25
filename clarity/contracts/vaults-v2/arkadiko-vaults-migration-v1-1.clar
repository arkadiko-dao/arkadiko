;; Vaults Migration 
;; Migrate V1 to V2
;;
;; Vaults system V1 is stopped, after which the data is stored off chain.
;; Data is added to V2 via this contract.
;;

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u990401)
(define-constant ERR_MIGRATE_FAILED u990001)

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
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))
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

;; ---------------------------------------------------------
;; Pool Liq
;; ---------------------------------------------------------

(define-public (migrate-pool-liq 
  (stakers (list 200 { 
    staker: principal, 
    amount: uint,
  }))
)
  (let (
    (migrate-result (map migrate-pool-liq-iter stakers))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))
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
