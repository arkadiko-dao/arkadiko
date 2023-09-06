;; Vaults Pool Fees 
;; Keep stability fees
;;

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u980401)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; Withdraw earned stability fees
(define-public (withdraw-stability-fee)
  (let (
    (receiver tx-sender)
    (balance (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender))))
  )
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (try! (as-contract (contract-call? .usda-token transfer balance tx-sender receiver none)))
    (ok balance)
  )
)