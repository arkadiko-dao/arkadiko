(impl-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait vault-trait .arkadiko-vault-trait-v1.vault-trait)
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; errors
(define-constant ERR-NOT-AUTHORIZED u9401)
(define-constant ERR-TRANSFER-FAILED u92)
(define-constant ERR-DEPOSIT-FAILED u95)
(define-constant ERR-WITHDRAW-FAILED u96)
(define-constant ERR-MINT-FAILED u97)
(define-constant ERR-WRONG-TOKEN u98)
(define-constant ERR-TOO-MUCH-DEBT u99)

(define-public (calculate-usda-count
  (token (string-ascii 12))
  (ucollateral-amount uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (let ((price (unwrap-panic (contract-call? oracle fetch-price token))))
    (let ((amount
      (/
        (* ucollateral-amount (get last-price price))
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
  (ucollateral uint)
  (oracle <oracle-trait>)
)
  (let ((price (unwrap-panic (contract-call? oracle fetch-price token))))
    (if (> debt u0)
      (ok (/ (/ (* ucollateral (get last-price price)) debt) u10000))
      (err u0)
    )
  )
)

(define-public (collateralize-and-mint
  (token <ft-trait>)
  (token-string (string-ascii 12))
  (ucollateral-amount uint)
  (debt uint)
  (sender principal)
  (stacker-name (string-ascii 256))
  (stack-pox bool)
)
  (let (
    (token-symbol (unwrap-panic (contract-call? token get-symbol)))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string token-symbol) (err ERR-WRONG-TOKEN))
    (asserts! (not (is-eq token-string "STX")) (err ERR-WRONG-TOKEN))

    ;; token should be a trait e.g. 'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token
    (match (contract-call? token transfer ucollateral-amount sender (as-contract tx-sender) none)
      success (ok debt)
      error (err error)
    )
  )
)

(define-public (deposit (token <ft-trait>) (token-string (string-ascii 12)) (additional-ucollateral-amount uint) (stacker-name (string-ascii 256)))
  (let (
    (token-symbol (unwrap-panic (contract-call? token get-symbol)))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string token-symbol) (err ERR-WRONG-TOKEN))
    (asserts! (not (is-eq token-string "STX")) (err ERR-WRONG-TOKEN))

    (match (contract-call? token transfer additional-ucollateral-amount tx-sender (as-contract tx-sender) none)
      success (ok true)
      error (err ERR-DEPOSIT-FAILED)
    )
  )
)

(define-public (withdraw (token <ft-trait>) (token-string (string-ascii 12)) (vault-owner principal) (ucollateral-amount uint))
  (let (
    (token-symbol (unwrap-panic (contract-call? token get-symbol)))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string token-symbol) (err ERR-WRONG-TOKEN))
    (asserts! (not (is-eq token-symbol "STX")) (err ERR-WRONG-TOKEN))

    (if (> ucollateral-amount u0)
      (match (as-contract (contract-call? token transfer ucollateral-amount tx-sender vault-owner none))
        success (ok true)
        error (err ERR-WITHDRAW-FAILED)
      )
      (ok true)
    )
  )
)

(define-public (mint
  (token-string (string-ascii 12))
  (vault-owner principal)
  (ucollateral-amount uint)
  (current-debt uint)
  (extra-debt uint)
  (collateralization-ratio uint)
  (oracle <oracle-trait>)
)
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq token-string "STX")) (err ERR-WRONG-TOKEN))

    (let ((max-new-debt (- (unwrap-panic (calculate-usda-count token-string ucollateral-amount collateralization-ratio oracle)) current-debt)))
      (if (>= max-new-debt extra-debt)
        (match (as-contract (contract-call? .arkadiko-dao mint-token .usda-token extra-debt vault-owner))
          success (ok true)
          error (err ERR-MINT-FAILED)
        )
        (err ERR-TOO-MUCH-DEBT)
      )
    )
  )
)

(define-public (burn (token <ft-trait>) (vault-owner principal) (collateral-to-return uint))
  (let (
    (token-symbol (unwrap-panic (contract-call? token get-symbol)))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq token-symbol "STX")) (err ERR-WRONG-TOKEN))

    (match (as-contract (contract-call? token transfer collateral-to-return tx-sender vault-owner none))
      transferred (ok true)
      error (err ERR-TRANSFER-FAILED)
    )
  )
)

(define-public (redeem-collateral (token <ft-trait>) (token-string (string-ascii 12)) (ucollateral uint) (owner principal))
  (let (
    (token-symbol (unwrap-panic (contract-call? token get-symbol)))
  )
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq token-string token-symbol) (err ERR-WRONG-TOKEN))
    (asserts! (not (is-eq token-string "STX")) (err ERR-WRONG-TOKEN))
    
    (as-contract (contract-call? token transfer ucollateral tx-sender owner none))
  )
)

(define-public (mint-xstx (collateral uint))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (contract-call? .arkadiko-dao mint-token .xstx-token collateral (as-contract tx-sender))
  )
)

;; redeem stx (and burn xSTX)
(define-public (burn-xstx (ustx-amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "freddie"))) (err ERR-NOT-AUTHORIZED))
    (try! (contract-call? .arkadiko-dao burn-token .xstx-token  ustx-amount sender))
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Admin Functions
;; ---------------------------------------------------------

;; this should be called when upgrading contracts
;; SIP10 reserves can contain all SIP10 collateral types
;; so this method should be ran multiple times, once for each token
(define-public (migrate-funds (new-vault <vault-trait>) (token <ft-trait>))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (let (
      (balance (unwrap-panic (contract-call? token get-balance (as-contract tx-sender))))
    )
      (as-contract (contract-call? token transfer balance tx-sender (contract-of new-vault) none))
    )
  )
)
