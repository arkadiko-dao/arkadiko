;; Contains all state for freddie the vault manager

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

;; Map of vault entries
;; The entry consists of a user principal with their collateral and debt balance
(define-map vaults { id: uint } {
  id: uint,
  owner: principal,
  collateral: uint,
  collateral-type: (string-ascii 12), ;; e.g. STX-A, STX-B, BTC-A etc (represents the collateral class)
  collateral-token: (string-ascii 12), ;; e.g. STX, BTC etc (represents the symbol of the collateral)
  stacked-tokens: uint,
  revoked-stacking: bool,
  auto-payoff: bool,
  debt: uint,
  stacker-name: (string-ascii 256),
  created-at-block-height: uint,
  updated-at-block-height: uint,
  stability-fee-accrued: uint,
  stability-fee-last-accrued: uint, ;; indicates the block height at which the stability fee was last accrued (calculated)
  is-liquidated: bool,
  auction-ended: bool,
  leftover-collateral: uint
})
(define-map vault-entries { user: principal } { ids: (list 20 uint) })
(define-map closing-vault
  { user: principal }
  { vault-id: uint }
)
(define-map stacking-payout
  { vault-id: uint, lot-index: uint }
  {
    collateral-amount: uint,
    principal: principal
  }
)
(define-map stacking-payout-lots
  { vault-id: uint }
  {
    ids: (list 500 uint)
  }
)
(define-data-var last-vault-id uint u0)
(define-constant ERR-NOT-AUTHORIZED u7401)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-vault-by-id (id uint))
  (default-to
    {
      id: u0,
      owner: (contract-call? .arkadiko-dao get-dao-owner),
      collateral: u0,
      collateral-type: "",
      collateral-token: "",
      stacked-tokens: u0,
      stacker-name: "",
      revoked-stacking: false,
      debt: u0,
      created-at-block-height: u0,
      updated-at-block-height: u0,
      auto-payoff: false,
      stability-fee-accrued: u0,
      stability-fee-last-accrued: u0,
      is-liquidated: false,
      auction-ended: false,
      leftover-collateral: u0
    }
    (map-get? vaults { id: id })
  )
)

(define-read-only (get-vault-entries (user principal))
  (unwrap! (map-get? vault-entries { user: user }) (tuple (ids (list u0) )))
)

(define-read-only (get-last-vault-id)
  (var-get last-vault-id)
)

(define-read-only (get-stacking-payout (vault-id uint) (lot-index uint))
  (default-to
    { collateral-amount: u0, principal: (contract-call? .arkadiko-dao get-dao-owner) }
    (map-get? stacking-payout { vault-id: vault-id, lot-index: lot-index })
  )
)
(define-read-only (get-stacking-payout-lots (vault-id uint))
  (unwrap! (map-get? stacking-payout-lots { vault-id: vault-id }) (tuple (ids (list u0) )))
)

(define-public (set-last-vault-id (vault-id uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (ok (var-set last-vault-id vault-id))
  )
)

(define-read-only (get-vaults (user principal))
  (let ((entries (get ids (get-vault-entries user))))
    (ok (map get-vault-by-id entries))
  )
)

(define-public (update-vault (vault-id uint) (data (tuple (id uint) (owner principal) (collateral uint) (collateral-type (string-ascii 12)) (collateral-token (string-ascii 12)) (stacker-name (string-ascii 256)) (stacked-tokens uint) (auto-payoff bool) (revoked-stacking bool) (debt uint) (created-at-block-height uint) (updated-at-block-height uint) (stability-fee-accrued uint) (stability-fee-last-accrued uint) (is-liquidated bool) (auction-ended bool) (leftover-collateral uint))))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
  
    (map-set vaults (tuple (id vault-id)) data)
    (ok true)
  )
)

(define-public (update-vault-entries (user principal) (vault-id uint))
  (let ((entries (get ids (get-vault-entries user))))
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (map-set vault-entries { user: user } { ids: (unwrap-panic (as-max-len? (append entries vault-id) u20)) })
    (ok true)
  )
)

(define-private (remove-burned-vault (vault-id uint))
  (let ((current-vault (unwrap-panic (map-get? closing-vault { user: tx-sender }))))
    (if (is-eq vault-id (get vault-id current-vault))
      false
      true
    )
  )
)

(define-public (close-vault (vault-id uint))
  (let (
    (vault (get-vault-by-id vault-id))
    (entries (get ids (get-vault-entries (get owner vault))))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (map-set closing-vault { user: (get owner vault) } { vault-id: vault-id })
    (map-set vault-entries { user: tx-sender } { ids: (filter remove-burned-vault entries) })
    (ok (map-delete vaults { id: vault-id }))
  )
)

(define-public (set-stacker-payout (vault-id uint) (lot-index uint) (collateral-amount uint) (recipient principal))
  (let ((entries (get ids (get-stacking-payout-lots vault-id))))
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "auction-engine")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (map-set stacking-payout
      { vault-id: vault-id, lot-index: lot-index }
      {
        collateral-amount: collateral-amount,
        principal: recipient
      }
    )
    (if (is-none (index-of entries lot-index))
      (map-set stacking-payout-lots { vault-id: vault-id } { ids: (unwrap-panic (as-max-len? (append entries lot-index) u500)) })
      true
    )
    (ok true)
  )
)
