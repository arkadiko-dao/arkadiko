;; @contract Arkadiko multisig oracle
;; @version 2.3

(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED u8401)
(define-constant ERR-OLD-MESSAGE u8402)
(define-constant ERR-SIGNATURES-NOT-UNIQUE u8403)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var minimum-valid-signers uint u3)

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
(define-map signatures-used (buff 65) bool)

(define-map token-id-to-names uint (list 4 (string-ascii 12)))
(define-map token-name-to-id (string-ascii 12) uint)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

;; @desc check if given public key is trusted
(define-read-only (is-trusted-oracle (pubkey (buff 33)))
  (default-to false (map-get? trusted-oracles pubkey))
)

;; @desc check if given signature is already used
(define-read-only (is-signature-used (signature (buff 65)))
  (default-to false (map-get? signatures-used signature))
)

;; @desc get token ID for given name
(define-read-only (get-token-id-from-name (name (string-ascii 12)))
  (default-to u0 (map-get? token-name-to-id name))
)

;; @desc get list of token names for given token ID
(define-read-only (get-token-names-from-id (id uint))
  (default-to (list ) (map-get? token-id-to-names id))
)

;; @desc get minimum valid signers needed
(define-read-only (get-minimum-valid-signers)
  (var-get minimum-valid-signers)
)

;; @desc get price info for given token name
(define-read-only (get-price (token (string-ascii 12)))
  (unwrap! (map-get? prices { token: token }) { last-price: u0, last-block: u0, decimals: u0 })
)

;; @desc get price info response for given token name
(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)

;; ---------------------------------------------------------
;; Message signing
;; ---------------------------------------------------------

;; @desc update token price as DAO owner
;; @param token; token to update price for
;; @param price; price value
;; @param decimals; amount of decimals
;; @post bool; returns true
(define-public (update-price-owner (token-id uint) (price uint) (decimals uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (unwrap-panic (update-price-multi-helper token-id price decimals))
    (ok price)
  )
)

;; @desc update token price as multisig node
;; @param block; the block on which the message was created
;; @param token-id; token ID to update price for
;; @param price; price value
;; @param decimals; amount of decimals
;; @param signatures; list of signatures from oracle nodes
;; @post bool; returns true if successful
(define-public (update-price-multi (block uint) (token-id uint) (price uint) (decimals uint) (signatures (list 10 (buff 65))))
  (let (
    (block-list (list block block block block block block block block block block))
    (token-id-list (list token-id token-id token-id token-id token-id token-id token-id token-id token-id token-id))
    (price-list (list price price price price price price price price price price))
    (decimals-list (list decimals decimals decimals decimals decimals decimals decimals decimals decimals decimals))

    (check-result (fold + (map check-price-signer block-list token-id-list price-list decimals-list signatures) u0))
  )
    (asserts! (< burn-block-height (+ block u10)) (err ERR-OLD-MESSAGE))
    (asserts! (is-eq (fold and (map check-unique-signatures-iter signatures) true) true) (err ERR-SIGNATURES-NOT-UNIQUE))

    (if (>= check-result (var-get minimum-valid-signers))
      (update-price-multi-helper token-id price decimals)
      (ok false)
    )
  )
)

;; Helper method to update price for given token ID
;; Will iterate over all token names based on token ID
(define-private (update-price-multi-helper (token-id uint) (price uint) (decimals uint) )
  (let (
    (names-list (get-token-names-from-id token-id))
    (prices-list (list price price price price))
    (decimals-list (list decimals decimals decimals decimals))
  )
    (map update-price-token-iter names-list prices-list decimals-list)
    (ok true)
  )
)

;; Helper method to iterate over all token names and update prices
(define-private (update-price-token-iter (token (string-ascii 12)) (price uint) (decimals uint))
  (begin
    (map-set prices { token: token } { last-price: price, last-block: burn-block-height, decimals: decimals })
    (ok true)
  )
)

;; Helper method to iterate over all signatures in a list
;; The signatures are added to a map, so that a signature can only be used once
(define-private (check-unique-signatures-iter (signature (buff 65)))
  (if (is-signature-used signature)
    false
    (begin
      (map-set signatures-used signature true)
      true
    )
  )
)

;; ---------------------------------------------------------
;; Message signers
;; ---------------------------------------------------------

;; Recover the public key given the values and a signature
(define-read-only (pubkey-price-signer (block uint) (token-id uint) (price uint) (decimals uint) (signature (buff 65)))
  (secp256k1-recover? (get-signable-message-hash block token-id price decimals) signature)
)

;; Recover the public key given the values and a signature, check if trusted
;; If not trusted it could be that the oracle itself is not trusted, or the values have been tampered with
(define-read-only (check-price-signer (block uint) (token-id uint) (price uint) (decimals uint) (signature (buff 65)))
  (let (
    (pubKey (unwrap! (pubkey-price-signer block token-id price decimals signature) u0))
  )
    (if (is-trusted-oracle pubKey) u1 u0)
  )
)

;; ---------------------------------------------------------
;; Signable message
;; ---------------------------------------------------------

;; Create a message hash to sign, given price values
(define-read-only (get-signable-message-hash (block uint) (token-id uint) (price uint) (decimals uint))
  (keccak256 (concat (concat (concat (uint256-to-buff-be block) (uint256-to-buff-be token-id)) (uint256-to-buff-be price)) (uint256-to-buff-be decimals)))
)

(define-read-only (uint256-to-buff-be (n uint))
  (unwrap-panic (as-max-len? (get a (fold uint-to-buff-iter 0x0000000000000000000000000000000000000000000000000000000000000000 {n: n, a: 0x})) u32))
)

(define-constant byte-list 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff)

(define-private (uint-to-buff-iter (b (buff 1)) (p {n: uint, a: (buff 32)}))
  {
    a: (unwrap-panic (as-max-len? (concat (if (is-eq (get n p) u0) 0x00 (unwrap-panic (element-at byte-list (mod (get n p) u256)))) (get a p)) u32)),
    n: (/ (get n p) u256)
  }
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

;; Link token ID to token name
(define-public (set-token-id (token-id uint) (token-name (string-ascii 12)))
  (let (
    (current-list (get-token-names-from-id token-id))
    (new-list (unwrap-panic (as-max-len? (append current-list token-name) u4)))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set token-id-to-names token-id new-list)
    (map-set token-name-to-id token-name token-id)
    (ok true)
  )
)

;; Set minimum signers needed to update price
(define-public (set-minimum-valid-signers (minimum uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    
    (var-set minimum-valid-signers minimum)
    (ok true)
  )
)

;; Add trusted oracle public keys
(define-public (set-trusted-oracle (pubkey (buff 33)) (trusted bool))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set trusted-oracles pubkey trusted)
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  (map-set token-id-to-names u1 (list "STX" "xSTX"))
  (map-set token-name-to-id "STX" u1)
  (map-set token-name-to-id "xSTX" u1)

  (map-set token-id-to-names u2 (list "BTC" "xBTC"))
  (map-set token-name-to-id "BTC" u2)
  (map-set token-name-to-id "xBTC" u2)

  (map-set token-id-to-names u3 (list "USDA"))
  (map-set token-name-to-id "USDA" u3)

  (map-set token-id-to-names u4 (list "STX/USDA"))
  (map-set token-name-to-id "STX/USDA" u4)

  (map-set token-id-to-names u5 (list "DIKO"))
  (map-set token-name-to-id "DIKO" u5)

  (map-set token-id-to-names u6 (list "atALEX" "auto-alex"))
  (map-set token-name-to-id "atALEX" u6)
  (map-set token-name-to-id "auto-alex" u6)

  (map-set token-id-to-names u7 (list "atALEXv2" "auto-alex-v2"))
  (map-set token-name-to-id "atALEXv2" u7)
  (map-set token-name-to-id "auto-alex-v2" u7)

  (map-set token-id-to-names u8 (list "stSTX" "ststx-token"))
  (map-set token-name-to-id "stSTX" u8)
  (map-set token-name-to-id "ststx-token" u8)
)
