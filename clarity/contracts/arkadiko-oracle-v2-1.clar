(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

(define-constant ERR-NOT-WHITELISTED u851)
(define-constant ERR-UNTRUSTED-ORACLE u852)
(define-constant ERR-UNKNOWN-SYMBOL u853)
(define-constant ERR-NOT-AUTHORIZED u8401)

(define-data-var oracle-owner principal tx-sender)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map prices
  { token: (string-ascii 12) }
  {
    last-price: uint,
    last-block: uint,
    decimals: uint
  }
)

(define-map trusted-oracles (buff 33) bool)

(define-map redstone-symbol-to-tokens (buff 32) (list 4 (string-ascii 12)))


;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (is-trusted-oracles (pubkey (list 8 (response (buff 33) uint))))
	(let (
    (trusted (map is-trusted-oracle pubkey))
  )
    (is-eq (index-of trusted false) none)
  )
)

(define-read-only (is-trusted-oracle (pubkey (response (buff 33) uint)))
  (let (
    (key (unwrap! pubkey false))
  )
    (default-to false (map-get? trusted-oracles key))
  )
)

(define-read-only (get-redstone-symbol-to-tokens (buff (buff 32)))
  (map-get? redstone-symbol-to-tokens buff)
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-trusted-oracle (pubkey (buff 33)) (trusted bool))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set trusted-oracles pubkey trusted)
    (ok true)
  )
)

(define-public (set-redstone-symbol-to-tokens (buff (buff 32)) (tokens (list 4 (string-ascii 12))))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set redstone-symbol-to-tokens buff tokens)
    (ok true)
  )
)

(define-public (set-oracle-owner (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set oracle-owner address))
  )
)

;; ---------------------------------------------------------
;; Update price
;; ---------------------------------------------------------

(define-public (update-price (token (string-ascii 12)) (price uint) (decimals uint))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-owner)) (err ERR-NOT-WHITELISTED))
    (map-set prices { token: token } { last-price: price, last-block: block-height, decimals: decimals })
    (ok price)
  )
)

(define-public (update-prices-redstone (timestamp uint) (entries (list 10 {symbol: (buff 32), value: uint})) (signatures (list 8 (buff 65))))
  (let (
    ;; TODO - Update for mainnet
    (signers (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.redstone-verify recover-signer-multi timestamp entries signatures))
  
    (update-result (map update-price-redstone entries))
  )
    (asserts! (is-trusted-oracles signers) (err ERR-UNTRUSTED-ORACLE))

    (ok update-result)
  )
)

;; To loop over all entries
(define-private (update-price-redstone (entry {symbol: (buff 32), value: uint}))
  (let (
    (tokens (unwrap! (get-redstone-symbol-to-tokens (get symbol entry)) (err ERR-UNKNOWN-SYMBOL)))
    (value (get value entry))

  )
    (map update-price-redstone-token tokens (list value value value value))
    (ok true)
  )
)

;; To loop over all tokens for one symbol
(define-private (update-price-redstone-token (token (string-ascii 12)) (value uint))
  (begin
    (map-set prices { token: token } { last-price: value, last-block: block-height, decimals: u100000000 })
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Get price
;; ---------------------------------------------------------

(define-read-only (get-price (token (string-ascii 12)))
  (unwrap! (map-get? prices { token: token }) { last-price: u0, last-block: u0, decimals: u0 })
)

(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)
