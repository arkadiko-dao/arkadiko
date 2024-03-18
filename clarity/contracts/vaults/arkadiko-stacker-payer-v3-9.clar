;; Implementation of Stacker Payer
;; which allows users to redeem xSTX for STX
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant ERR-NOT-AUTHORIZED u22401)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u221)
(define-constant ERR-ALREADY-CLAIMED u222)

(define-public (redeem-stx (token <ft-trait>) (amount uint))
  (let (
    (sender tx-sender)
  )
    (asserts! (is-enabled) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (> amount u0) (ok u0))

    (try! (contract-call? .arkadiko-dao burn-token .xstx-token amount sender))
    (try! (contract-call? .arkadiko-vaults-pool-active-v1-1 withdraw token sender amount))

    (ok amount)
  )
)

(define-public (claim-leftover-vault-xstx (vault-id uint) (sender principal))
  (let (
    (sender tx-sender)
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
  )
    (asserts! (> (get collateral vault) u0) (err ERR-ALREADY-CLAIMED))
    (asserts! (> (get leftover-collateral vault) u0) (err ERR-ALREADY-CLAIMED))

    (try! (contract-call? .arkadiko-dao mint-token .xstx-token (get leftover-collateral vault) sender))
    (try! (contract-call? .arkadiko-vault-data-v1-1 update-vault vault-id (merge vault {
      collateral: u0,
      updated-at-block-height: block-height,
      leftover-collateral: u0
    })))

    (ok true)
  )
)
