;; Arkadiko - Claim Yield 
;; 
;; Allows users to claim PoX yields into their vaults.
;; Initially, a stacker payer was designed to pay out yields and deposit the yield automatically into vaults
;; However, this is not a feasible solution since it does not scale in number of vaults
;; N vaults would require N transactions
;; Therefore, we have this yield claimer that allows a user to claim their yield each cycle (or few cycles)
;; We might deprecate this claimer once Stacks throughput improves or we find a solution that scales better
;;

(define-constant ERR-NOT-AUTHORIZED u40401)

(define-map claims
  { vault-id: uint }
  {
    ustx: uint
  }
)

(define-read-only (get-claim-by-vault-id (vault-id uint))
  (default-to
    {
      ustx: u0
    }
    (map-get? claims { vault-id: vault-id })
  )
)

(define-public (add-claims (recipients (list 200 { to: uint, ustx: uint })))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map add-claim recipients)
    (ok true)
  )
)

(define-public (add-claim (recipient { to: uint, ustx: uint }))
  (let (
    (claim (get-claim-by-vault-id (get to recipient)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set claims { vault-id: (get to recipient) } { ustx: (+ (get ustx recipient) (get ustx claim)) })
    (ok true)
  )
)

(define-public (claim (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (claim (get-claim-by-vault-id vault-id))
  )
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))

    ;; TODO - deposit into vault or send to user?

    (ok true)
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;       Helpers
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; returns the STX balance of the claim contract
(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; return STX to the STX reserve
;; can be used since yield is not trustless today
(define-public (return-stx (ustx-amount uint))
  (let (
    (dao-address (contract-call? .arkadiko-dao get-dao-owner))
  )
    (asserts! (is-eq tx-sender dao-address) (err ERR-NOT-AUTHORIZED))

    (as-contract (stx-transfer? ustx-amount tx-sender dao-address))
  )
)
