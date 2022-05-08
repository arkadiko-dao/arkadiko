;; Arkadiko - Claim Yield 
;; 
;; Allows users to claim PoX yields into their vaults.
;; Yield in this case is denominated in USDA
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
    usda: uint
  }
)

(define-read-only (get-claim-by-vault-id (vault-id uint))
  (default-to
    {
      usda: u0
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

(define-public (add-claims (recipients (list 200 { to: uint, usda: uint })))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map add-claim recipients)
    (ok true)
  )
)

(define-public (add-claim (recipient { to: uint, usda: uint }))
  (let (
    (claim-entry (get-claim-by-vault-id (get to recipient)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? .usda-token transfer (get usda recipient) tx-sender (as-contract tx-sender) none))
    (map-set claims { vault-id: (get to recipient) } { usda: (+ (get usda recipient) (get usda claim-entry)) })
    (ok true)
  )
)

(define-public (remove-claims (recipients (list 200 { to: uint, usda: uint })))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map remove-claim recipients)
    (ok true)
  )
)

(define-public (remove-claim (recipient { to: uint, usda: uint }))
  (let (
    (claim-entry (get-claim-by-vault-id (get to recipient)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (return-usda (get usda claim-entry)))
    (map-set claims { vault-id: (get to recipient) } { usda: (- (get usda claim-entry) (get usda recipient)) })
    (ok true)
  )
)

;; @desc Claim PoX yield and pay off debt
;; @param vault-id; your vault ID
;; @param reserve; active STX reserve
;; @param coll-type; active collateral types contract
;; @post boolean; returns true if claim was succesful
(define-public (claim (vault-id uint))
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (stacker-name (get stacker-name vault))
    (claim-entry (get-claim-by-vault-id vault-id))
    (sender tx-sender)
  )
    (asserts! (not (var-get claim-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get usda claim-entry) u0) (err ERR-NOTHING-TO-CLAIM))

    (try! (as-contract (contract-call? .usda-token transfer (get usda claim-entry) tx-sender sender none)))

    (map-set claims { vault-id: vault-id } { usda: u0 })
    (ok true)
  )
)

;; @desc Claim PoX yield and pay off debt
;; @param vault-id; your vault ID
;; @param reserve; active STX reserve
;; @param coll-type; active collateral types contract
;; @post boolean; returns true if claim was succesful
(define-public (claim-and-burn
  (vault-id uint)
  (reserve <vault-trait>)
  (coll-type <collateral-types-trait>)
)
  (let (
    (vault (contract-call? .arkadiko-vault-data-v1-1 get-vault-by-id vault-id))
    (stability-fee (unwrap-panic (contract-call? .arkadiko-freddie-v1-1 get-stability-fee-for-vault vault-id coll-type)))
    (stacker-name (get stacker-name vault))
    (claim-entry (get-claim-by-vault-id vault-id))
    (sender tx-sender)
  )
    (asserts! (not (var-get claim-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq tx-sender (get owner vault)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of reserve) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stx-reserve"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (contract-of coll-type) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "collateral-types"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (get usda claim-entry) u0) (err ERR-NOTHING-TO-CLAIM))

    (try! (as-contract (contract-call? .usda-token transfer (get usda claim-entry) tx-sender sender none)))
    (if (and (> (get debt vault) u0) (>= (get usda claim-entry) stability-fee))
      (try! (contract-call? .arkadiko-freddie-v1-1 burn vault-id (- (get usda claim-entry) stability-fee) reserve .arkadiko-token coll-type))
      true
    )

    (map-set claims { vault-id: vault-id } { usda: u0 })
    (ok true)
  )
)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;       Helpers
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; returns the USDA balance of the claim contract
(define-read-only (get-usda-balance)
  (unwrap-panic (contract-call? .usda-token get-balance (as-contract tx-sender)))
)

;; return USDA to the deposit address
;; can be used since yield is not trustless today
;; temporary method to avoid locked funds
(define-public (return-usda (usda-amount uint))
  (let (
    (dao-address (contract-call? .arkadiko-dao get-dao-owner))
  )
    (asserts! (is-eq contract-caller dao-address) (err ERR-NOT-AUTHORIZED))

    (as-contract (contract-call? .usda-token transfer usda-amount tx-sender dao-address none))
  )
)
