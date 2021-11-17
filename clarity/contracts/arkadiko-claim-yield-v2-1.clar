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
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait collateral-types-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)

(define-constant ERR-NOT-AUTHORIZED u40401)
(define-constant ERR-NOTHING-TO-CLAIM u40402)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u40403)

(define-data-var claim-shutdown-activated bool false)

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

(define-public (toggle-claim-shutdown)
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set claim-shutdown-activated (not (var-get claim-shutdown-activated))))
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

(define-public (remove-claims (recipients (list 200 { to: uint, ustx: uint })))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map remove-claim recipients)
    (ok true)
  )
)

(define-public (remove-claim (recipient { to: uint, ustx: uint }))
  (let (
    (claim-entry (get-claim-by-vault-id (get to recipient)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (return-stx (get ustx claim-entry)))
    (map-set claims { vault-id: (get to recipient) } { ustx: (- (get ustx claim-entry) (get ustx recipient)) })
    (ok true)
  )
)

;; @desc Claim PoX yield and add as collateral
;; @param vault-id; your vault ID
;; @param reserve; active STX reserve
;; @param coll-type; active collateral types contract
;; @post boolean; returns true if claim was succesful
(define-public (claim
  (vault-id uint)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
  (stack-yield bool)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (stacker-name (get stacker-name vault))
    (claim-entry (get-claim-by-vault-id vault-id))
    (sender tx-sender)
  )
    (asserts! (not (var-get claim-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get ustx claim-entry) u0) (err ERR-NOTHING-TO-CLAIM))

    (try! (as-contract (stx-transfer? (get ustx claim-entry) tx-sender sender)))
    (try! (contract-call? .arkadiko-freddie-v1-1 deposit vault-id (get ustx claim-entry) reserve .arkadiko-token coll-type))

    (if (is-eq stack-yield true)
      (begin
        ;; Toggle stacking
        (try! (contract-call? .arkadiko-freddie-v1-1 toggle-stacking vault-id))

        ;; Enable vault withdrawal
        (if (is-eq stacker-name "stacker")
          (try! (contract-call? .arkadiko-stacker-v1-1 enable-vault-withdrawals vault-id))
          (if (is-eq stacker-name "stacker-2")
            (try! (contract-call? .arkadiko-stacker-2-v1-1 enable-vault-withdrawals vault-id))
            (if (is-eq stacker-name "stacker-3")
              (try! (contract-call? .arkadiko-stacker-3-v1-1 enable-vault-withdrawals vault-id))
              (if (is-eq stacker-name "stacker-4")
                (try! (contract-call? .arkadiko-stacker-4-v1-1 enable-vault-withdrawals vault-id))
                false
              )
            )
          )
        )
        
        ;; Stack collateral
        (try! (contract-call? .arkadiko-freddie-v1-1 stack-collateral vault-id))
      )
      true
    )

    (map-set claims { vault-id: vault-id } { ustx: u0 })
    (ok true)
  )
)

;; @desc Claim PoX yield and use it to pay debt
;; @param vault-id; your vault ID
;; @param reserve; active STX reserve
;; @param coll-type; active collateral types contract
;; @post uint; returns amount of usda paid back
(define-public (claim-to-pay-debt
  (vault-id uint)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
)
  (let (
    (sender tx-sender)
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (claim-entry (get-claim-by-vault-id vault-id))

    (swapped-amounts (unwrap-panic (as-contract (contract-call? .arkadiko-swap-v2-1 swap-x-for-y .wrapped-stx-token .usda-token (get ustx claim-entry) u0))))
    (usda-amount (unwrap-panic (element-at swapped-amounts u1)))
    (stability-fee (unwrap-panic (contract-call? .arkadiko-freddie-v1-1 get-stability-fee-for-vault vault-id coll-type)))
    (leftover-usda
      (if (> usda-amount stability-fee)
        (- usda-amount stability-fee)
        u0
      )
    )
  )
    (asserts! (not (var-get claim-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get ustx claim-entry) u0) (err ERR-NOTHING-TO-CLAIM))

    ;; pay back stability fee
    (if (>= usda-amount stability-fee)
      (try! (contract-call? .arkadiko-freddie-v1-1 pay-stability-fee vault-id coll-type))
      u0
    )

    ;; pay back part of debt
    (if (> leftover-usda u0)
      (try! (contract-call? .arkadiko-freddie-v1-1 burn vault-id leftover-usda reserve .arkadiko-token coll-type))
      true
    )

    (map-set claims { vault-id: vault-id } { ustx: u0 })
    (ok usda-amount)
  )
)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;       Helpers
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; returns the STX balance of the claim contract
(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; return STX to the deposit address
;; can be used since yield is not trustless today
;; temporary method to avoid locked funds
(define-public (return-stx (ustx-amount uint))
  (let (
    (dao-address (contract-call? .arkadiko-dao get-dao-owner))
  )
    (asserts! (is-eq contract-caller dao-address) (err ERR-NOT-AUTHORIZED))

    (as-contract (stx-transfer? ustx-amount tx-sender dao-address))
  )
)
