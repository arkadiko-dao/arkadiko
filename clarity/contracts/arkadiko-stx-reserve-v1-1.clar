(impl-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; errors
(define-constant ERR-NOT-AUTHORIZED u11401)
(define-constant ERR-TRANSFER-FAILED u112)
(define-constant ERR-MINTER-FAILED u113)
(define-constant ERR-BURN-FAILED u114)
(define-constant ERR-DEPOSIT-FAILED u115)
(define-constant ERR-WITHDRAW-FAILED u116)
(define-constant ERR-MINT-FAILED u117)
(define-constant ERR-WRONG-TOKEN u118)
(define-constant ERR-TOO-MUCH-DEBT u119)

(define-data-var tokens-to-stack uint u0)

;; MAIN LOGIC

(define-read-only (get-tokens-to-stack)
  (ok (var-get tokens-to-stack))
)

(define-public (add-tokens-to-stack (token-amount uint))
  (begin
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (var-set tokens-to-stack (+ (var-get tokens-to-stack) token-amount))
    (ok u200)
  )
)

(define-public (subtract-tokens-to-stack (token-amount uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (var-set tokens-to-stack (- (var-get tokens-to-stack) token-amount))
    (ok u200)
  )
)

(define-public (toggle-stacking (revoked-stacking bool) (ustx-collateral uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (if (is-eq true revoked-stacking)
      (ok (try! (subtract-tokens-to-stack ustx-collateral)))
      (ok (try! (add-tokens-to-stack ustx-collateral)))
    )
  )
)

;; transfers (var-get tokens-to-stack) tokens to the stacker contract
(define-public (request-stx-to-stack (requested-ustx uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= requested-ustx (var-get tokens-to-stack)) (err ERR-NOT-AUTHORIZED))

    (as-contract
      (stx-transfer? requested-ustx (as-contract tx-sender) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
    )
  )
)

;; calculate the amount of stablecoins to mint, based on posted STX amount
;; ustx-amount * stx-price-in-cents == dollar-collateral-posted-in-cents
;; (dollar-collateral-posted-in-cents / collateral-to-debt-ratio) == stablecoins to mint
(define-public (calculate-usda-count
  (token (string-ascii 12))
  (ustx-amount uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (let ((stx-price-in-cents (unwrap-panic (contract-call? oracle fetch-price token))))
    (let ((amount
      (/
        (* ustx-amount (get last-price-in-cents stx-price-in-cents))
        collateralization-ratio
      ))
    )
      (ok amount)
    )
  )
)

(define-public (calculate-current-collateral-to-debt-ratio
  (token (string-ascii 12))
  (debt uint)
  (ustx uint)
  (oracle <oracle-trait>)
)
  (let ((stx-price-in-cents (unwrap-panic (contract-call? oracle fetch-price token))))
    (if (> debt u0)
      (ok (/ (* ustx (get last-price-in-cents stx-price-in-cents)) debt))
      (err u0)
    )
  )
)

;; accept collateral in STX tokens
;; save STX in stx-reserve-address
;; calculate price and collateralisation ratio
(define-public (collateralize-and-mint (token <ft-trait>) (token-string (string-ascii 12)) (ustx-amount uint) (debt uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

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
(define-public (deposit (token <ft-trait>) (token-string (string-ascii 12)) (additional-ustx-amount uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

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
(define-public (withdraw (token <ft-trait>) (token-string (string-ascii 12)) (vault-owner principal) (ustx-amount uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

    (match (print (as-contract (stx-transfer? ustx-amount (as-contract tx-sender) vault-owner)))
      success (ok true)
      error (err ERR-WITHDRAW-FAILED)
    )
  )
)

;; mint new tokens when collateral to debt allows it (i.e. > collateral-to-debt-ratio)
(define-public (mint
  (token-string (string-ascii 12))
  (vault-owner principal)
  (ustx-amount uint)
  (current-debt uint)
  (extra-debt uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

    (let ((max-new-debt (- (unwrap-panic (calculate-usda-count token-string ustx-amount collateralization-ratio oracle)) current-debt)))
      (if (>= max-new-debt extra-debt)
        (match (print (as-contract (contract-call? .arkadiko-dao mint-token .usda-token extra-debt vault-owner)))
          success (ok true)
          error (err ERR-MINT-FAILED)
        )
        (err ERR-TOO-MUCH-DEBT)
      )
    )
  )
)

;; burn stablecoin to free up STX tokens
;; method assumes position has not been liquidated
;; and thus collateral to debt ratio > liquidation ratio
(define-public (burn (token <ft-trait>) (vault-owner principal) (collateral-to-return uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (match (print (as-contract (stx-transfer? collateral-to-return (as-contract tx-sender) vault-owner)))
      transferred (ok true)
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

(define-public (redeem-collateral (token <ft-trait>) (token-string (string-ascii 12)) (stx-collateral uint) (owner principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

    (as-contract (stx-transfer? stx-collateral (as-contract tx-sender) owner))
  )
)

(define-public (redeem-xstx (ustx-amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (match (print (as-contract (stx-transfer? ustx-amount (as-contract tx-sender) sender)))
      transferred (ok true)
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

;; ---------------------------------------------------------
;; Admin Functions
;; ---------------------------------------------------------

(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; this should be called when upgrading contracts
;; STX reserve should only contain STX
(define-public (migrate-funds (new-vault <vault-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (as-contract (stx-transfer? (stx-get-balance (as-contract tx-sender)) (as-contract tx-sender) (contract-of new-vault)))
  )
)

(define-public (set-tokens-to-stack (new-tokens-to-stack uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (var-set tokens-to-stack new-tokens-to-stack)
    (ok true)
  )
)

(define-public (migrate-state (new-vault <vault-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (try! (contract-call? new-vault set-tokens-to-stack (var-get tokens-to-stack)))
    (ok true)
  )
)
