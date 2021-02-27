;; implements a trait that allows collateral of any token (e.g. stx, bitcoin)
(define-trait vault-trait
  (
    ;; calculate stablecoin count to mint from posted collateral
    (calculate-arkadiko-count (uint) (response uint uint))

    ;; ;; Transfer from the caller to a new principal
    ;; (transfer (uint principal principal) (response bool uint))

    ;; ;; the human readable name of the token
    ;; (name () (response (string-ascii 32) uint))

    ;; ;; the ticker symbol, or empty if none
    ;; (symbol () (response (string-ascii 32) uint))

    ;; ;; the number of decimals used, e.g. 6 would mean 1_000_000 represents 1 token
    ;; (decimals () (response uint uint))

    ;; ;; the balance of the passed principal
    ;; (balance-of (principal) (response uint uint))

    ;; ;; the current total supply (which does not need to be a constant)
    ;; (total-supply () (response uint uint))
  )
)
