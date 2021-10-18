(impl-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
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

(define-data-var next-stacker-name (string-ascii 256) "stacker")
(define-map tokens-to-stack
  { stacker-name: (string-ascii 256) }
  {
    amount: uint
  }
)

;; MAIN LOGIC

(define-read-only (get-tokens-to-stack (name (string-ascii 256)))
  (ok (get amount (unwrap-panic (map-get? tokens-to-stack { stacker-name: name }))))
)

(define-public (add-tokens-to-stack (name (string-ascii 256)) (token-amount uint))
  (let (
    (stacker (unwrap-panic (map-get? tokens-to-stack { stacker-name: name })))
  )
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (map-set tokens-to-stack { stacker-name: name } { amount: (+ (get amount stacker) token-amount) })
    (ok u200)
  )
)

(define-public (subtract-tokens-to-stack (name (string-ascii 256)) (token-amount uint))
  (let (
    (stacker (unwrap-panic (map-get? tokens-to-stack { stacker-name: name })))
  )
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (err ERR-NOT-AUTHORIZED)
    )

    (map-set tokens-to-stack { stacker-name: name } { amount: (- (get amount stacker) token-amount) })
    (ok u200)
  )
)

(define-public (toggle-stacking (stacker-name (string-ascii 256)) (revoked-stacking bool) (ustx-collateral uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (if (is-eq true revoked-stacking)
      (ok (try! (subtract-tokens-to-stack stacker-name ustx-collateral)))
      (ok (try! (add-tokens-to-stack stacker-name ustx-collateral)))
    )
  )
)

;; get STX to auto payoff vault
(define-public (request-stx-to-auto-payoff (requested-ustx uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer"))) (err ERR-NOT-AUTHORIZED))

    (as-contract
      (stx-transfer? requested-ustx tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-payer")))
    )
  )
)

(define-public (request-stx-to-stack (name (string-ascii 256)) (requested-ustx uint))
  (let (
    (stacker (unwrap-panic (map-get? tokens-to-stack { stacker-name: name })))
  )
    (asserts!
      (or
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (<= requested-ustx (get amount stacker)) (err ERR-NOT-AUTHORIZED))

    (as-contract
      (stx-transfer? requested-ustx tx-sender (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name name)))
    )
  )
)

(define-read-only (get-next-stacker-name)
  (var-get next-stacker-name)
)

(define-public (set-next-stacker-name (stacker-name (string-ascii 256)))
  (begin
    (if
      (or
        (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-2")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-3")))
        (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stacker-4")))
      )
      (ok (var-set next-stacker-name stacker-name))
      (err ERR-NOT-AUTHORIZED)
    )
  )
)

;; calculate the amount of stablecoins to mint, based on posted STX amount
;; ustx-amount * stx-price == dollar-collateral-posted
;; (dollar-collateral-posted / collateral-to-debt-ratio) == stablecoins to mint
(define-public (calculate-usda-count
  (token (string-ascii 12))
  (ustx-amount uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (let ((stx-price (unwrap-panic (contract-call? oracle fetch-price token))))
    (let ((amount
      (/
        (* ustx-amount (get last-price stx-price))
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
  (let ((stx-price (unwrap-panic (contract-call? oracle fetch-price token))))
    (if (> debt u0)
      (ok (/ (/ (* ustx (get last-price stx-price)) debt) u10000))
      (err u0)
    )
  )
)

;; accept collateral in STX tokens
;; save STX in stx-reserve-address
;; calculate price and collateralisation ratio
(define-public (collateralize-and-mint
  (token <ft-trait>)
  (token-string (string-ascii 12))
  (ustx-amount uint)
  (debt uint)
  (sender principal)
  (stacker-name (string-ascii 256))
  (stack-pox bool)
)
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

    (match (print (stx-transfer? ustx-amount sender (as-contract tx-sender)))
      success (begin
        (if (is-eq stack-pox true)
          (try! (add-tokens-to-stack stacker-name ustx-amount))
          u0
        )
        (ok debt)
      )
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

;; deposit extra collateral in vault
(define-public (deposit (token <ft-trait>) (token-string (string-ascii 12)) (additional-ustx-amount uint) (stacker-name (string-ascii 256)))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

    (match (print (stx-transfer? additional-ustx-amount tx-sender (as-contract tx-sender)))
      success (begin
        (try! (add-tokens-to-stack stacker-name additional-ustx-amount))
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

    (match (print (as-contract (stx-transfer? ustx-amount tx-sender vault-owner)))
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

    (match (print (as-contract (stx-transfer? collateral-to-return tx-sender vault-owner)))
      transferred (ok true)
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

(define-public (redeem-collateral (token <ft-trait>) (token-string (string-ascii 12)) (stx-collateral uint) (owner principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string "STX") (err ERR-WRONG-TOKEN))

    (as-contract (stx-transfer? stx-collateral tx-sender owner))
  )
)

(define-public (redeem-xstx (ustx-amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))

    (match (print (as-contract (stx-transfer? ustx-amount tx-sender sender)))
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

(define-public (set-tokens-to-stack (name (string-ascii 256)) (new-tokens-to-stack uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set tokens-to-stack { stacker-name: name } { amount: new-tokens-to-stack })
    (ok true)
  )
)

;; this should be called when upgrading contracts
;; STX reserve should only contain STX
(define-public (migrate-funds (new-vault <vault-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (as-contract (stx-transfer? (stx-get-balance tx-sender) tx-sender (contract-of new-vault)))
  )
)


(define-public (migrate-state (new-vault <vault-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    ;; (try! (contract-call? new-vault set-tokens-to-stack (var-get tokens-to-stack)))
    (ok true)
  )
)


;; initialization
(map-set tokens-to-stack { stacker-name: "stacker" } { amount: u0 })
(map-set tokens-to-stack { stacker-name: "stacker-2" } { amount: u0 })
(map-set tokens-to-stack { stacker-name: "stacker-3" } { amount: u0 })
(map-set tokens-to-stack { stacker-name: "stacker-4" } { amount: u0 })
