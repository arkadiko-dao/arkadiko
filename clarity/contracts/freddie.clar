;; Freddie - The Vault Manager
;; Freddie is an abstraction layer that interacts with collateral type reserves (initially only STX)
;; Ideally, collateral reserves should never be called from outside. Only manager layers should be interacted with from clients

;; errors
(define-constant err-unauthorized u1)
(define-constant err-transfer-failed u2)
(define-constant err-minter-failed u3)
(define-constant err-burn-failed u4)
(define-constant err-deposit-failed u5)
(define-constant err-withdraw-failed u6)
(define-constant err-mint-failed u7)
(define-constant err-liquidation-failed u8)
(define-constant err-insufficient-collateral u9)

;; constants
(define-constant blocks-per-day u144)
(define-constant mint-owner 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP)

;; Map of vault entries
;; The entry consists of a user principal with their collateral and debt balance
(define-map vaults { id: uint } {
  id: uint,
  owner: principal,
  collateral: uint,
  collateral-type: (string-ascii 4),
  debt: uint,
  created-at-block-height: uint,
  updated-at-block-height: uint,
  stability-fee-last-paid: uint, ;; indicates the block height at which the stability fee was last paid
  is-liquidated: bool,
  auction-ended: bool,
  leftover-collateral: uint
})
(define-map vault-entries { user: principal } { ids: (list 1500 uint) })
(define-data-var last-vault-id uint u0)

;; getters
(define-read-only (get-vault-by-id (id uint))
  (unwrap!
    (map-get? vaults { id: id })
    (tuple
      (id u0)
      (owner 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP)
      (collateral u0)
      (collateral-type "")
      (debt u0)
      (created-at-block-height u0)
      (updated-at-block-height u0)
      (stability-fee-last-paid u0)
      (is-liquidated false)
      (leftover-collateral u0)
    )
  )
)

(define-read-only (get-vault-entries (user principal))
  (unwrap! (map-get? vault-entries { user: user }) (tuple (ids (list u0) )))
)

(define-read-only (get-vaults (user principal))
  (let ((entries (get ids (get-vault-entries user))))
    (ok (map get-vault-by-id entries))
  )
)

(define-read-only (calculate-current-collateral-to-debt-ratio (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (ok (unwrap! (contract-call? .stx-reserve calculate-current-collateral-to-debt-ratio (get debt vault) (get collateral vault)) (ok u0)))
  )
)

(define-public (collateralize-and-mint (collateral-amount uint) (debt uint) (sender principal) (collateral-type (string-ascii 4)))
  (let ((ratio (unwrap-panic (contract-call? .stx-reserve calculate-current-collateral-to-debt-ratio debt collateral-amount))))
    (asserts! (>= ratio (unwrap-panic (contract-call? .dao get-liquidation-ratio "stx"))) (err err-insufficient-collateral))

    (let ((debt-created (contract-call? .stx-reserve collateralize-and-mint collateral-amount debt sender)))
      (if (is-ok (as-contract (contract-call? .xusd-token mint debt sender)))
        (begin
          (let ((vault-id (+ (var-get last-vault-id) u1)))
            (let ((entries (get ids (get-vault-entries sender))))
              (map-set vault-entries { user: sender } { ids: (unwrap-panic (as-max-len? (append entries vault-id) u1500)) })
              (map-set vaults
                { id: vault-id }
                {
                  id: vault-id,
                  owner: sender,
                  collateral: collateral-amount,
                  collateral-type: collateral-type,
                  debt: debt,
                  created-at-block-height: block-height,
                  updated-at-block-height: block-height,
                  stability-fee-last-paid: block-height,
                  is-liquidated: false,
                  auction-ended: false,
                  leftover-collateral: u0
                }
              )
              (var-set last-vault-id vault-id)
              (ok debt)
            )
          )
        )
        (err err-minter-failed)
      )
    )
  )
)

(define-public (deposit (vault-id uint) (uamount uint))
  (let ((vault (get-vault-by-id vault-id)))
    (if (unwrap-panic (contract-call? .stx-reserve deposit uamount))
      (begin
        (let ((new-collateral (+ uamount (get collateral vault))))
          (map-set vaults
            { id: vault-id }
            {
              id: vault-id,
              owner: tx-sender,
              collateral: new-collateral,
              collateral-type: (get collateral-type vault),
              debt: (get debt vault),
              created-at-block-height: (get created-at-block-height vault),
              updated-at-block-height: block-height,
              stability-fee-last-paid: (get stability-fee-last-paid vault),
              is-liquidated: false,
              auction-ended: false,
              leftover-collateral: u0
            }
          )
          (ok true)
        )
      )
      (err err-deposit-failed)
    )
  )
)

(define-public (withdraw (vault-id uint) (uamount uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts! (is-eq tx-sender (get owner vault)) (err err-unauthorized))

    (if (unwrap-panic (contract-call? .stx-reserve withdraw (get owner vault) uamount))
      (begin
        (let ((new-collateral (- (get collateral vault) uamount)))
          (map-set vaults
            { id: vault-id }
            {
              id: vault-id,
              owner: tx-sender,
              collateral: new-collateral,
              collateral-type: (get collateral-type vault),
              debt: (get debt vault),
              created-at-block-height: (get created-at-block-height vault),
              updated-at-block-height: block-height,
              stability-fee-last-paid: (get stability-fee-last-paid vault),
              is-liquidated: false,
              auction-ended: false,
              leftover-collateral: u0
            }
          )
          (ok true)
        )
      )
      (err err-withdraw-failed)
    )
  )
)

(define-public (mint (vault-id uint) (extra-debt uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts! (is-eq tx-sender (get owner vault)) (err err-unauthorized))

    (if (unwrap-panic (contract-call? .stx-reserve mint (get owner vault) (get collateral vault) (get debt vault) extra-debt))
      (begin
        (let ((new-total-debt (+ extra-debt (get debt vault))))
          (map-set vaults
            { id: vault-id }
            {
              id: vault-id,
              owner: (get owner vault),
              collateral: (get collateral vault),
              collateral-type: (get collateral-type vault),
              debt: new-total-debt,
              created-at-block-height: (get created-at-block-height vault),
              updated-at-block-height: block-height,
              stability-fee-last-paid: (get stability-fee-last-paid vault),
              is-liquidated: false,
              auction-ended: false,
              leftover-collateral: u0
            }
          )
          (ok true)
        )
      )
      (err err-mint-failed)
    )
  )
)

;; TODO: is this atomic? e.g. if xUSD burn succeeds but STX reserve burn fails, what then?
(define-public (burn (vault-id uint) (vault-owner principal))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts! (is-eq tx-sender (get owner vault)) (err err-unauthorized))

    (if (is-ok (contract-call? .xusd-token burn (get debt vault) (get owner vault)))
      (if (unwrap-panic (contract-call? .stx-reserve burn (get owner vault) (get collateral vault)))
        (begin
          (let ((entries (get ids (get-vault-entries vault-owner))))
            (map-set vaults
              { id: vault-id }
              {
                id: vault-id,
                owner: vault-owner,
                collateral: u0,
                collateral-type: (get collateral-type vault),
                debt: u0,
                created-at-block-height: (get created-at-block-height vault),
                updated-at-block-height: block-height,
                stability-fee-last-paid: (get stability-fee-last-paid vault),
                is-liquidated: false,
                auction-ended: false,
                leftover-collateral: u0
              }
            )
            ;; TODO: remove vault ID from vault entries
            ;; (map-set vault-entries { user: tx-sender } { () })
            (ok (map-delete vaults { id: vault-id }))
          )
        )
        (err err-burn-failed)
      )
      (err err-burn-failed)
    )
  )
)

;; Calculate stability fee based on time
;; 144 blocks = 1 day
;; to be fair, this is a very rough approximation
;; the goal is not to get the exact interest,
;; but rather to (dis)incentivize the user to mint stablecoins or not
(define-read-only (get-stability-fee-for-vault (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (let ((days (/ (- block-height (get stability-fee-last-paid vault)) blocks-per-day)))
      (let ((debt (/ (get debt vault) u10000))) ;; we can round to 2 numbers after comma, e.g. 1925000 uxUSD == 1.92 xUSD
        (let ((daily-interest (/ (* debt (unwrap-panic (contract-call? .dao get-stability-fee "stx"))) u100)))
          (ok (tuple (fee (* daily-interest days)) (decimals u8) (days days))) ;; 8 decimals so u5233 means 5233/10^8 xUSD daily interest
        )
      )
    )
  )
)

(define-public (liquidate (vault-id uint))
  (if (is-eq contract-caller .liquidator)
    (begin
      (let ((vault (get-vault-by-id vault-id)))
        (if (is-ok (contract-call? .stx-reserve liquidate (get collateral vault) (get debt vault)))
          (begin
            (let ((collateral (get collateral vault)))
              (map-set vaults
                { id: vault-id }
                {
                  id: vault-id,
                  owner: (get owner vault),
                  collateral: u0,
                  collateral-type: (get collateral-type vault),
                  debt: (get debt vault),
                  created-at-block-height: (get created-at-block-height vault),
                  updated-at-block-height: block-height,
                  stability-fee-last-paid: (get stability-fee-last-paid vault),
                  is-liquidated: true,
                  auction-ended: false,
                  leftover-collateral: u0
                }
              )
              (let ((debt (/ (* (unwrap-panic (contract-call? .dao get-liquidation-ratio "stx")) (get debt vault)) u100)))
                (ok (tuple (ustx-amount collateral) (debt (+ debt (get debt vault)))))
              )
            )
          )
          (err err-liquidation-failed)
        )
      )
    )
    (err err-unauthorized)
  )
)

(define-public (finalize-liquidation (vault-id uint) (leftover-collateral uint) (debt-raised uint))
  (if (is-eq contract-caller .auction-engine)
    (let ((vault (get-vault-by-id vault-id)))
      (if (is-ok (contract-call? .xusd-token burn debt-raised mint-owner))
        (begin
          (map-set vaults
            { id: vault-id }
            {
              id: vault-id,
              owner: (get owner vault),
              collateral: u0,
              collateral-type: (get collateral-type vault),
              debt: (get debt vault),
              created-at-block-height: (get created-at-block-height vault),
              updated-at-block-height: block-height,
              stability-fee-last-paid: (get stability-fee-last-paid vault),
              is-liquidated: true,
              auction-ended: true,
              leftover-collateral: leftover-collateral
            }
          )
          (ok true)
        )
        (err err-liquidation-failed)
      )
    )
    (err err-unauthorized)
  )
)

(define-public (withdraw-leftover-collateral (vault-id uint))
  (let ((vault (get-vault-by-id vault-id)))
    (asserts! (is-eq tx-sender (get owner vault)) (err err-unauthorized))
    (if (unwrap-panic (contract-call? .stx-reserve withdraw (get owner vault) (get leftover-collateral vault)))
      (begin
        (map-set vaults
          { id: vault-id }
          {
            id: vault-id,
            owner: tx-sender,
            collateral: (get collateral vault),
            collateral-type: (get collateral-type vault),
            debt: (get debt vault),
            created-at-block-height: (get created-at-block-height vault),
            updated-at-block-height: block-height,
            stability-fee-last-paid: (get stability-fee-last-paid vault),
            is-liquidated: true,
            auction-ended: true,
            leftover-collateral: u0
          }
        )
        (ok true)
      )
      (err err-withdraw-failed)
    )
  )
)
