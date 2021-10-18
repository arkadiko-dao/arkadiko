;; @contract Vault Rewards - Claim DIKO vault rewards
;; @version 1.1

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
(define-data-var vault-rewards-shutdown-activated bool false)

(define-public (toggle-vault-rewards-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (ok (var-set vault-rewards-shutdown-activated (not (var-get vault-rewards-shutdown-activated))))
  )
)

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

    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    ;; Save latest cumm reward
    (unwrap-panic (increase-cumm-reward-per-collateral))
    ;; Claim all pending rewards so we can set the new cumm-reward for this user
    (try! (claim-pending-rewards-for user))
    ;; Update total
    (var-set total-collateral (+ current-total-collateral collateral))
    ;; Save cumm reward again, as total changed
    (unwrap-panic (increase-cumm-reward-per-collateral))
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
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    ;; Save latest cumm reward
    (unwrap-panic (increase-cumm-reward-per-collateral))
    ;; Claim all pending rewards so we can set the new cumm-reward for this user
    (try! (claim-pending-rewards-for user))
    ;; Update total
    (var-set total-collateral (- current-total-collateral collateral))
    ;; Save cumm reward again, as total changed
    (unwrap-panic (increase-cumm-reward-per-collateral))
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

;; @desc claim pending vault rewards
;; @post uint; amount of rewards claimed
(define-public (claim-pending-rewards)
  (begin
    (claim-pending-rewards-for tx-sender)
  )
)

;; Claim rewards for user
(define-private (claim-pending-rewards-for (user principal))
  (begin
    ;; Increase so we know new value for this user
    (unwrap-panic (increase-cumm-reward-per-collateral))

    (let (
      (pending-rewards (unwrap! (get-pending-rewards user) (err ERR-REWARDS-CALC)))
      (collateral-of (get-collateral-of user))
    )
      ;; Only mint if enough pending rewards and amount is positive
      (if (>= pending-rewards u1)
        (begin
          ;; Mint DIKO rewards for user
          (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token pending-rewards user))

          (map-set user-collateral { user: user } (merge collateral-of { cumm-reward-per-collateral: (var-get cumm-reward-per-collateral) }))

          (ok pending-rewards)
        )
        (ok u0)
      )
    )
  )
)

;; Freddie can claim rewards when vault gets liquidated
(define-public (claim-pending-rewards-liquidated-vault (user principal))
  (begin

    ;; Only freddie is allowed to call this method
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    ;; Increase so we know new value for this user
    (unwrap-panic (increase-cumm-reward-per-collateral))

    (let (
      (pending-rewards (unwrap! (get-pending-rewards user) (err ERR-REWARDS-CALC)))
      (collateral-of (get-collateral-of user))
    )
      ;; Only mint if enough pending rewards and amount is positive
      (if (>= pending-rewards u1)
        (begin
          ;; Mint DIKO rewards for user
          (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token pending-rewards contract-caller))

          (map-set user-collateral { user: user } (merge collateral-of { cumm-reward-per-collateral: (var-get cumm-reward-per-collateral) }))

          (ok pending-rewards)
        )
        (ok u0)
      )
    )
  )
)

;; @desc increase cumm reward per collateral and save
;; @post uint; returns new cummulative rewards per collateral
(define-public (increase-cumm-reward-per-collateral)
  (let (
    ;; Calculate new cumm reward per collateral
    (new-cumm-reward-per-collateral (calculate-cumm-reward-per-collateral))
  )
    (asserts! (> block-height (var-get last-reward-increase-block)) (ok u0))

    (var-set cumm-reward-per-collateral new-cumm-reward-per-collateral)
    (var-set last-reward-increase-block block-height)
    (ok new-cumm-reward-per-collateral)
  )
)

;; Calculate current cumm reward per collateral
(define-read-only (calculate-cumm-reward-per-collateral)
  (let (
    (rewards-per-block (get-rewards-per-block))
    (current-total-collateral (var-get total-collateral))
    (current-cumm-reward-per-collateral (var-get cumm-reward-per-collateral)) 
  )
    (if (and
      (> current-total-collateral u0)
      (> block-height (var-get last-reward-increase-block))
    )
      (let (
        (total-rewards-to-distribute (* rewards-per-block (- block-height (var-get last-reward-increase-block))))
        (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) current-total-collateral))
        (new-cumm-reward-per-collateral (+ current-cumm-reward-per-collateral reward-added-per-token))
      )
        new-cumm-reward-per-collateral
      )
      current-cumm-reward-per-collateral
    )
  )
)

(define-private (get-rewards-per-block)
  (if (is-eq (var-get vault-rewards-shutdown-activated) true)
    u0
    (contract-call? .arkadiko-diko-guardian-v1-1 get-vault-rewards-per-block)
  )
)

;; Initialize the contract
(begin
  (var-set last-reward-increase-block u35300)
)
