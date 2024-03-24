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
;; Vaults
;; ---------------------------------------------------------

(define-public (migrate-vaults
  (vaults (list 200 { 
    owner: principal, 
    token: principal, 
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
  })
)
  (let (
    (owner (get owner vaultInfo))
    (token (get token vaultInfo))
  )
    ;; Save vault data
    (unwrap! (contract-call? .arkadiko-vaults-sorted-v1-1 remove owner token) (ok false))

    (ok true)
  )
)
