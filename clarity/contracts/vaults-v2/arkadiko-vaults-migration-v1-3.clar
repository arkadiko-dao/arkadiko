;; Vaults Migration 
;; Migrate V1 to V2
;;
;; Vaults system V1 is stopped, after which the data is stored off chain.
;; Data is added to V2 via this contract.
;;

(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u990401)
(define-constant ERR_MIGRATE_FAILED u990001)

;; ---------------------------------------------------------
;; Pool Liq
;; ---------------------------------------------------------

(define-public (migrate-pool-liq-funds)
  (let (
    (usda-amount (unwrap-panic (contract-call? .usda-token get-balance .arkadiko-vaults-pool-liq-v1-1)))
  )
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? .arkadiko-dao burn-token .usda-token usda-amount .arkadiko-vaults-pool-liq-v1-1)))
    (try! (as-contract (contract-call? .arkadiko-dao mint-token .usda-token usda-amount .arkadiko-vaults-pool-liq-v1-2)))

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
    (unwrap! (contract-call? .arkadiko-vaults-pool-liq-v1-2 migrate-pool-liq staker amount) (ok false))

    (ok true)
  )
)
