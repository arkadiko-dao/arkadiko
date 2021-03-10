(impl-trait .vault-trait.vault-trait)

;; addresses
(define-constant stx-reserve-address 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP)
(define-constant stx-liquidation-reserve 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE)

;; errors
(define-constant err-unauthorized u1)
(define-constant err-transfer-failed u2)
(define-constant err-minter-failed u3)
(define-constant err-burn-failed u4)
(define-constant err-deposit-failed u5)
(define-constant err-withdraw-failed u6)
(define-constant err-mint-failed u7)

;; risk parameters
(define-data-var liquidation-ratio uint u150)
(define-data-var collateral-to-debt-ratio uint u200)
(define-data-var maximum-debt uint u100000000)
(define-data-var liquidation-penalty uint u13)
(define-data-var stability-fee uint u0)

;; Map of vault entries
;; The entry consists of a user principal with their STX balance collateralized
(define-map vaults { id: uint } { id: uint, address: principal, stx-collateral: uint, coins-minted: uint, at-block-height: uint })
(define-map vault-entries { user: principal } { ids: (list 2000 uint) })
(define-data-var last-vault-id uint u0)

;; getters
(define-read-only (get-vault-by-id (id uint))
  (unwrap! (map-get? vaults { id: id }) (tuple (id u0) (address 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP) (stx-collateral u0) (coins-minted u0) (at-block-height u0)))
)

(define-read-only (get-vault-entries (user principal))
  (unwrap! (map-get? vault-entries { user: user }) (tuple (ids (list u0) )))
)

(define-read-only (get-vaults (user principal))
  (let ((entries (get ids (get-vault-entries user))))
    (ok (map get-vault-by-id entries))
  )
)

(define-read-only (get-risk-parameters)
  (ok (tuple
    (liquidation-ratio (var-get liquidation-ratio))
    (collateral-to-debt-ratio (var-get collateral-to-debt-ratio))
    (maximum-debt (var-get maximum-debt))
    (liquidation-penalty (var-get liquidation-penalty))
    (stability-fee (var-get stability-fee))
    )
  )
)

(define-read-only (get-liquidation-ratio)
  (ok (var-get liquidation-ratio))
)

(define-read-only (get-collateral-to-debt-ratio)
  (ok (var-get collateral-to-debt-ratio))
)

(define-read-only (get-maximum-debt)
  (ok (var-get maximum-debt))
)

(define-read-only (get-liquidation-penalty)
  (ok (var-get liquidation-penalty))
)

;; setters accessible only by DAO contract
(define-public (set-liquidation-ratio (ratio uint))
  (if (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.dao)
    (begin
      (var-set liquidation-ratio ratio)
      (ok (var-get liquidation-ratio))
    )
    (ok (var-get liquidation-ratio))
  )
)

(define-public (set-collateral-to-debt-ratio (ratio uint))
  (if (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.dao)
    (begin
      (var-set collateral-to-debt-ratio ratio)
      (ok (var-get collateral-to-debt-ratio))
    )
    (ok (var-get collateral-to-debt-ratio))
  )
)

(define-public (set-maximum-debt (debt uint))
  (if (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.dao)
    (begin
      (var-set maximum-debt debt)
      (ok (var-get maximum-debt))
    )
    (ok (var-get maximum-debt))
  )
)

(define-public (set-liquidation-penalty (penalty uint))
  (if (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.dao)
    (begin
      (var-set liquidation-penalty penalty)
      (ok (var-get liquidation-penalty))
    )
    (ok (var-get liquidation-penalty))
  )
)

;; MAIN LOGIC

;; calculate the amount of stablecoins to mint, based on posted STX amount
;; ustx-amount * stx-price-in-cents == dollar-collateral-posted-in-cents
;; (dollar-collateral-posted-in-cents / collateral-to-debt-ratio) == stablecoins to mint
(define-read-only (calculate-arkadiko-count (ustx-amount uint))
  (let ((stx-price-in-cents (contract-call? .oracle get-price)))
    (let ((amount (/ (* ustx-amount (get price stx-price-in-cents)) (var-get collateral-to-debt-ratio))))
      (ok amount)
    )
  )
)

(define-read-only (calculate-current-collateral-to-debt-ratio (vault-id uint))
  (let ((stx-price-in-cents (contract-call? .oracle get-price)))
    (let ((vault (get-vault-by-id vault-id)))
      (if (> (get coins-minted vault) u0)
        (ok (/ (* (get stx-collateral vault) (get price stx-price-in-cents)) (get coins-minted vault)))
        (err u0)
      )
    )
  )
)

;; accept collateral in STX tokens
;; save STX in stx-reserve-address
;; calculate price and collateralisation ratio
(define-public (collateralize-and-mint (ustx-amount uint) (sender principal))
  (let ((coins (unwrap-panic (calculate-arkadiko-count ustx-amount))))
    (match (print (stx-transfer? ustx-amount sender (as-contract tx-sender)))
      success (match (print (as-contract (contract-call? .arkadiko-token mint coins sender)))
        transferred (begin
          (let ((vault-id (+ (var-get last-vault-id) u1)))
            (let ((entries (get ids (get-vault-entries sender))))
              (map-set vault-entries { user: sender } { ids: (unwrap-panic (as-max-len? (append entries vault-id) u2000)) })
              (map-set vaults { id: vault-id } { id: vault-id, address: sender, stx-collateral: ustx-amount, coins-minted: coins, at-block-height: block-height })
              (var-set last-vault-id vault-id)
              (ok coins)
            )
          )
        )
        error (err err-transfer-failed)
      )
      error (err err-minter-failed)
    )
  )
)

;; deposit extra collateral in vault
;; TODO: assert that tx-sender == vault owner
(define-public (deposit (vault-id uint) (ustx-amount uint))
  (let ((vault (get-vault-by-id vault-id)))
    (match (print (stx-transfer? ustx-amount tx-sender (as-contract tx-sender)))
      success (begin
        (let ((new-stx-collateral (+ ustx-amount (get stx-collateral vault))))
          (map-set vaults { id: vault-id } {
            id: vault-id, address: tx-sender,
            stx-collateral: new-stx-collateral, coins-minted: (get coins-minted vault),
            at-block-height: block-height }
          )
          (ok true)
        )
      )
      error (err err-deposit-failed)
    )
  )
)

;; withdraw collateral (e.g. if collateral goes up in value)
;; TODO: assert that tx-sender == vault owner
;; TODO: make sure not more is withdrawn than collateral-to-debt-ratio
;; TODO: make sure ustx-amount < stx-collateral in vault (and is positive)
(define-public (withdraw (vault-id uint) (ustx-amount uint))
  (let ((vault (get-vault-by-id vault-id)))
    (match (print (as-contract (stx-transfer? ustx-amount (as-contract tx-sender) (get address vault))))
      success (begin
        (let ((new-stx-collateral (- ustx-amount (get stx-collateral vault))))
          (map-set vaults { id: vault-id } {
            id: vault-id, address: tx-sender,
            stx-collateral: new-stx-collateral, coins-minted: (get coins-minted vault),
            at-block-height: block-height }
          )
          (ok true)
        )
      )
      error (err err-withdraw-failed)
    )
  )
)

;; mint new tokens when collateral to debt allows it (i.e. > collateral-to-debt-ratio)
(define-public (mint (vault-id uint) (coins-amount uint))
  (let ((vault (get-vault-by-id vault-id)))
    (let ((coins (- (get coins-minted vault) (unwrap-panic (calculate-arkadiko-count (get stx-collateral vault))))))
      (if (>= coins coins-amount)
        (match (print (as-contract (contract-call? .arkadiko-token mint coins-amount (get address vault))))
          success (begin
            (let ((new-coins-amount (+ coins-amount (get coins-amount vault))))
              (map-set vaults { id: vault-id } {
                id: vault-id, address: (get address vault),
                stx-collateral: (get stx-collateral vault), coins-minted: new-coins-amount,
                at-block-height: block-height }
              )
              (ok true)
            )
          )
          error (err err-mint-failed)
        )
      )
      error (err err-mint-failed)
    )
  )
)

;; burn stablecoin to free up STX tokens
;; method assumes position has not been liquidated
;; and thus collateral to debt ratio > liquidation ratio
;; TODO: assert that tx-sender owns the vault
(define-public (burn (vault-id uint) (vault-owner principal))
  (let ((vault (get-vault-by-id vault-id)))
    (match (print (as-contract (contract-call? .arkadiko-token burn (get coins-minted vault) vault-owner)))
      success (match (print (as-contract (stx-transfer? (get stx-collateral vault) (as-contract tx-sender) vault-owner)))
        transferred (begin
          (let ((entries (get ids (get-vault-entries vault-owner))))
            (print (map-set vaults { id: vault-id } { id: vault-id, address: vault-owner, stx-collateral: u0, coins-minted: u0, at-block-height: (get at-block-height vault) } ))
            ;; TODO: remove vault ID from vault entries
            ;; (map-set vault-entries { user: tx-sender } { () })
            (ok (map-delete vaults { id: vault-id }))
          )
        )
        error (err err-transfer-failed)
      )
      error (err err-burn-failed)
    )
  )
)

;; liquidate a vault-address' vault
;; should only be callable by the liquidator smart contract address
(define-public (liquidate (vault-id uint))
  (if (is-eq contract-caller 'ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH.liquidator)
    (begin
      (let ((vault (get-vault-by-id vault-id)))
        (match (print (as-contract (contract-call? .arkadiko-token burn (get coins-minted vault) (get address vault))))
          success (match (stx-transfer? (get stx-collateral vault) stx-reserve-address stx-liquidation-reserve)
            transferred (begin
              (let ((stx-collateral (get stx-collateral vault)))
                (map-delete vaults { id: vault-id })
                (ok stx-collateral)
              )
            )
            error (err err-transfer-failed)
          )
          error (err err-burn-failed)
        )
      )
    )
    (err err-unauthorized)
  )
)
