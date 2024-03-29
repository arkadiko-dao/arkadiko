;; Implementation of Stacker Payer
;; which allows users to redeem xSTX for STX
;; and to claim xSTX from old liquidated vaults
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-ALREADY-CLAIMED u222)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var shutdown-activated bool false)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-shutdown-activated) 
  (var-get shutdown-activated)
)

;; ---------------------------------------------------------
;; User actions
;; ---------------------------------------------------------

(define-public (claim-leftover-vault-xstx (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (> (get collateral vault) u0) (err ERR-ALREADY-CLAIMED))
    (asserts! (> (get leftover-collateral vault) u0) (err ERR-ALREADY-CLAIMED))

    (try! (contract-call? .arkadiko-dao mint-token .xstx-token (get leftover-collateral vault) (get owner vault)))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
      collateral: u0,
      updated-at-block-height: block-height,
      leftover-collateral: u0
    })))

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-shutdown-activated (activated bool))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set shutdown-activated activated)

    (ok true)
  )
)
