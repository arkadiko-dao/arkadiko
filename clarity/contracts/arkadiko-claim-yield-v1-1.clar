;; Arkadiko - Claim Yield 
;; 
;; Allows users to claim PoX yields into their vaults.
;; Initially, a stacker payer was designed to pay out yields and deposit the yield automatically into vaults
;; However, this is not a feasible solution since it does not scale in number of vaults
;; N vaults would require N transactions
;; Therefore, we have this yield claimer that allows a user to claim their yield each cycle (or few cycles)
;; We might deprecate this claimer once Stacks throughput improves or we find a solution that scales better
;;

(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)

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
    (claim-entry (get-claim-by-vault-id (get to recipient)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (stx-transfer? (get ustx recipient) tx-sender (as-contract tx-sender)))
    (map-set claims { vault-id: (get to recipient) } { ustx: (+ (get ustx recipient) (get ustx claim-entry)) })
    (ok true)
  )
)

;; @desc Claim PoX yield as vault owner
;; @param vault-id; your vault ID
;; @param reserve; active STX reserve
;; @param coll-type; active collateral types contract
;; @post boolean; returns true if claim was succesful
(define-public (claim
  (vault-id uint)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (claim-entry (get-claim-by-vault-id vault-id))
    (sender tx-sender)
  )
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))

    (try! (as-contract (stx-transfer? (get ustx claim-entry) tx-sender sender)))
    (try! (contract-call? .arkadiko-freddie-v1-1 deposit vault-id (get ustx claim-entry) reserve .arkadiko-token coll-type))
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
