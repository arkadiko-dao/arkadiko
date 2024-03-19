;; Vaults Pool Fees 
;; Keep protocol revenue from vaults
;;

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u980401)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; Withdraw earned stability fees
(define-public (withdraw (token <ft-trait>))
  (let (
    (receiver tx-sender)
    (balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
  )
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? token transfer balance tx-sender receiver none)))
    (ok balance)
  )
)
