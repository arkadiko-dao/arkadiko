(impl-trait .vault-trait.vault-trait)
(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)

;; errors
(define-constant ERR-NOT-AUTHORIZED u11401)
(define-constant ERR-TRANSFER-FAILED u112)
(define-constant ERR-MINTER-FAILED u113)
(define-constant ERR-BURN-FAILED u114)
(define-constant ERR-DEPOSIT-FAILED u115)
(define-constant ERR-WITHDRAW-FAILED u116)
(define-constant ERR-MINT-FAILED u117)

(define-data-var tokens-to-stack uint u0)

;; MAIN LOGIC

(define-read-only (get-tokens-to-stack)
  (ok (var-get tokens-to-stack))
)

(define-public (add-tokens-to-stack (token-amount uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (var-set tokens-to-stack (+ (var-get tokens-to-stack) token-amount))
    (ok u200)
  )
)

(define-public (subtract-tokens-to-stack (token-amount uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (var-set tokens-to-stack (- (var-get tokens-to-stack) token-amount))
    (ok u200)
  )
)

(define-public (toggle-stacking (revoked-stacking bool) (ustx-collateral uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (if (is-eq true revoked-stacking)
      (ok (try! (add-tokens-to-stack ustx-collateral)))
      (ok (try! (subtract-tokens-to-stack ustx-collateral)))
    )
  )
)

;; calculate the amount of stablecoins to mint, based on posted STX amount
;; ustx-amount * stx-price-in-cents == dollar-collateral-posted-in-cents
;; (dollar-collateral-posted-in-cents / collateral-to-debt-ratio) == stablecoins to mint
(define-read-only (calculate-xusd-count (token (string-ascii 12)) (ustx-amount uint) (collateral-type (string-ascii 12)))
  (let ((stx-price-in-cents (contract-call? .oracle get-price token)))
    (let ((amount
      (/
        (* ustx-amount (get last-price-in-cents stx-price-in-cents))
        (unwrap-panic (contract-call? .collateral-types get-collateral-to-debt-ratio collateral-type))
      )))
      (ok amount)
    )
  )
)

(define-read-only (calculate-current-collateral-to-debt-ratio (token (string-ascii 12)) (debt uint) (ustx uint))
  (let ((stx-price-in-cents (contract-call? .oracle get-price token)))
    (if (> debt u0)
      (ok (/ (* ustx (get last-price-in-cents stx-price-in-cents)) debt))
      (err u0)
    )
  )
)

;; accept collateral in STX tokens
;; save STX in stx-reserve-address
;; calculate price and collateralisation ratio
(define-public (collateralize-and-mint (token <mock-ft-trait>) (ustx-amount uint) (debt uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (match (print (stx-transfer? ustx-amount sender (as-contract tx-sender)))
      success (begin
        (try! (add-tokens-to-stack ustx-amount))
        (ok debt)
      )
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

;; deposit extra collateral in vault
(define-public (deposit (token <mock-ft-trait>) (additional-ustx-amount uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (match (print (stx-transfer? additional-ustx-amount tx-sender (as-contract tx-sender)))
      success (begin
        (try! (add-tokens-to-stack additional-ustx-amount))
        (ok true)
      )
      error (err ERR-DEPOSIT-FAILED)
    )
  )
)

;; withdraw collateral (e.g. if collateral goes up in value)
(define-public (withdraw (token <mock-ft-trait>) (vault-owner principal) (ustx-amount uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (match (print (as-contract (stx-transfer? ustx-amount (as-contract tx-sender) vault-owner)))
      success (ok true)
      error (err ERR-WITHDRAW-FAILED)
    )
  )
)

;; mint new tokens when collateral to debt allows it (i.e. > collateral-to-debt-ratio)
(define-public (mint (token (string-ascii 12)) (vault-owner principal) (ustx-amount uint) (current-debt uint) (extra-debt uint) (collateral-type (string-ascii 12)))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (let ((max-new-debt (- (unwrap-panic (calculate-xusd-count token ustx-amount collateral-type)) current-debt)))
      (if (>= max-new-debt extra-debt)
        (match (print (as-contract (contract-call? .xusd-token mint extra-debt vault-owner)))
          success (ok true)
          error (err ERR-MINT-FAILED)
        )
        (err ERR-MINT-FAILED)
      )
    )
  )
)

;; burn stablecoin to free up STX tokens
;; method assumes position has not been liquidated
;; and thus collateral to debt ratio > liquidation ratio
(define-public (burn (token <mock-ft-trait>) (vault-owner principal) (collateral-to-return uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (match (print (as-contract (stx-transfer? collateral-to-return (as-contract tx-sender) vault-owner)))
      transferred (ok true)
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

;; liquidate a vault-address' vault
;; should only be callable by the liquidator smart contract address
;; the xUSD in the vault need to be covered & burnt
;; by xUSD earned through auctioning off the collateral in the current vault
;; 1. Mark vault as liquidated?
;; 2. Send collateral into the liquidator's liquidation reserve
(define-public (liquidate (token (string-ascii 12)) (stx-collateral uint) (current-debt uint))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (let ((new-debt (/ (* (unwrap-panic (contract-call? .collateral-types get-liquidation-penalty token)) current-debt) u100)))
      (ok (tuple (ustx-amount stx-collateral) (debt (+ new-debt current-debt))))
    )
  )
)

(define-public (redeem-collateral (token <mock-ft-trait>) (stx-collateral uint) (owner principal))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))
    (as-contract (stx-transfer? stx-collateral (as-contract tx-sender) owner))
  )
)

(define-public (redeem-xstx (ustx-amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))

    (match (print (as-contract (stx-transfer? ustx-amount (as-contract tx-sender) sender)))
      transferred (ok true)
      error (err ERR-TRANSFER-FAILED)
    )
  )
)
