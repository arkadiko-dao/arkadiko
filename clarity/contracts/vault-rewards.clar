;; Contains all state for freddie the vault manager

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

;; Constants
(define-constant ERR-NOT-AUTHORIZED u20401)
(define-constant ERR-REWARDS-CALC u20001)

;; To keep track of rewards
(define-data-var total-collateral uint u0) 
(define-data-var cumm-reward-per-collateral uint u0) 
(define-data-var last-reward-increase-block uint u0) 

;; Keep track of cumm rewards per collateral for user
(define-map user-collateral
   { user: principal } 
   {
      collateral: uint,
      cumm-reward-per-collateral: uint
   }
)

(define-read-only (get-collateral-of (user principal))
  (default-to
    { collateral: u0, cumm-reward-per-collateral: u0 }
    (map-get? user-collateral { user: user })
  )
)

;; Get stake info - amount staked
(define-read-only (get-collateral-amount-of (user principal))
  (get collateral (get-collateral-of user))
)

;; Add for user
(define-public (add-collateral (collateral uint) (user principal))
  (let (
    (current-collateral (get-collateral-amount-of user))
    (new-collateral (+ current-collateral collateral))
    (current-total-collateral (var-get total-collateral))
  )
    ;; Only freddie is allowed to call this method
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    ;; Save latest cumm reward
    (increase-cumm-reward-per-collateral)
    ;; Update total
    (var-set total-collateral (+ current-total-collateral collateral))
    ;; Save cumm reward again, as total changed
    (increase-cumm-reward-per-collateral)
    ;; Save for user
    (map-set user-collateral { user: user } { collateral: new-collateral, cumm-reward-per-collateral: (var-get cumm-reward-per-collateral) })

    (ok true)
  )
)

;; Remove for user
(define-public (remove-collateral (collateral uint) (user principal))
  (let (
    (current-collateral (get-collateral-amount-of user))
    (new-collateral (- current-collateral collateral))
    (current-total-collateral (var-get total-collateral))
  )
    ;; Only freddie is allowed to call this method
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    ;; Save latest cumm reward
    (increase-cumm-reward-per-collateral)
    ;; Update total
    (var-set total-collateral (- current-total-collateral collateral))
    ;; Save cumm reward again, as total changed
    (increase-cumm-reward-per-collateral)
    ;; Save for user
    (map-set user-collateral { user: user } { collateral: new-collateral, cumm-reward-per-collateral: (var-get cumm-reward-per-collateral) })

    (ok true)
  )
)

;; Get collateral info - last rewards block
(define-read-only (get-cumm-reward-per-collateral-of (user principal))
  (get cumm-reward-per-collateral 
    (default-to
      { cumm-reward-per-collateral: u0 }
      (map-get? user-collateral { user: user })
    )
  )
)

;; Get pending rewards for user
(define-read-only (get-pending-rewards (user principal))
  (let (
    (collateral-amount (get-collateral-amount-of user))
    (amount-owed-per-token (- (calculate-cumm-reward-per-collateral) (get-cumm-reward-per-collateral-of user)))
    (rewards-decimals (* collateral-amount amount-owed-per-token))
    (rewards (/ rewards-decimals u1000000))
  )
    (ok rewards)
  )
)

;; Claim rewards for user
(define-public (claim-pending-rewards)
  (begin

    ;; Increase so we know new value for this user
    (increase-cumm-reward-per-collateral)

    (let (
      (pending-rewards (unwrap! (get-pending-rewards tx-sender) (err ERR-REWARDS-CALC)))
      (collateral-of (get-collateral-of tx-sender))
    )
      ;; Only mint if enough pending rewards and amount is positive
      (if (>= pending-rewards u1)
        (begin
          ;; Mint DIKO rewards for user
          (try! (contract-call? .dao mint-token .arkadiko-token pending-rewards tx-sender))

          (map-set user-collateral { user: tx-sender } (merge collateral-of { cumm-reward-per-collateral: (var-get cumm-reward-per-collateral) }))

          (ok pending-rewards)
        )
        (ok u0)
      )
    )
  )
)

;; Increase cumm reward per collateral and save
(define-private (increase-cumm-reward-per-collateral)
  (let (
    ;; Calculate new cumm reward per collateral
    (new-cumm-reward-per-collateral (calculate-cumm-reward-per-collateral))
  )
    (var-set cumm-reward-per-collateral new-cumm-reward-per-collateral)
    (var-set last-reward-increase-block block-height)
    new-cumm-reward-per-collateral
  )
)

;; Calculate current cumm reward per collateral
(define-read-only (calculate-cumm-reward-per-collateral)
  (let (
    (rewards-per-block (contract-call? .diko-guardian get-vault-rewards-per-block))
    (current-total-collateral (var-get total-collateral))
    (block-diff (- block-height (var-get last-reward-increase-block)))
    (current-cumm-reward-per-collateral (var-get cumm-reward-per-collateral)) 
  )
    (if (> current-total-collateral u0)
      (let (
        (total-rewards-to-distribute (* rewards-per-block block-diff))
        (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) current-total-collateral))
        (new-cumm-reward-per-collateral (+ current-cumm-reward-per-collateral reward-added-per-token))
      )
        new-cumm-reward-per-collateral
      )
      current-cumm-reward-per-collateral
    )
  )
)

;; Initialize the contract
(begin
  (var-set last-reward-increase-block block-height)
)
