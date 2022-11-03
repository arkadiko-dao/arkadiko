(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED u8401)

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

(define-map token-id-to-name uint (string-ascii 12))
(define-map token-name-to-id (string-ascii 12) uint)

(define-map trusted-oracles (buff 33) bool)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (is-trusted-oracle (pubkey (buff 33)))
  (default-to false (map-get? trusted-oracles pubkey))
)

(define-read-only (get-token-id-from-name (name (string-ascii 12)))
  (unwrap-panic (map-get? token-name-to-id name))
)

(define-read-only (get-token-name-from-id (id uint))
  (unwrap-panic (map-get? token-id-to-name id))
)

(define-read-only (get-price (token (string-ascii 12)))
  (unwrap! (map-get? prices { token: token }) { last-price: u0, last-block: u0, decimals: u0 })
)

(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)

;; ---------------------------------------------------------
;; Message signing
;; ---------------------------------------------------------

(define-public (update-price-owner (token (string-ascii 12)) (price uint) (decimals uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-set prices { token: token } { last-price: price, last-block: block-height, decimals: decimals })
    (ok true)
  )
)

;; TODO: need to check if at least 3 DIFFERENT signatures
(define-public (update-price-multi (block uint) (token-id uint) (price uint) (decimals uint) (signatures (list 10 (buff 65))))
  (let (
    (token-name (get-token-name-from-id token-id))

    (block-list (list block block block block block block block block block block))
    (token-id-list (list token-id token-id token-id token-id token-id token-id token-id token-id token-id token-id))
    (price-list (list price price price price price price price price price price))
    (decimals-list (list decimals decimals decimals decimals decimals decimals decimals decimals decimals decimals))

    (check-result (fold + (map check-price-signer block-list token-id-list price-list decimals-list signatures) u0))
  )
    (if (>= check-result (var-get minimum-valid-signers))
      (begin
        (map-set prices { token: token-name } { last-price: price, last-block: block-height, decimals: decimals })
        (ok true)
      )
      (ok false)
    )
  )
)

;; ---------------------------------------------------------
;; Message signing
;; ---------------------------------------------------------

(define-read-only (pubkey-price-signer (block uint) (token-id uint) (price uint) (decimals uint) (signature (buff 65)))
  (secp256k1-recover? (get-signable-message-hash block token-id price decimals) signature)
)

(define-read-only (check-price-signer (block uint) (token-id uint) (price uint) (decimals uint) (signature (buff 65)))
  (let (
    (pubKey (unwrap! (pubkey-price-signer block token-id price decimals signature) u0))
  )
    (if (is-trusted-oracle pubKey) u1 u0)
  )
)

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

(define-public (set-token-id (token-id uint) (token-name (string-ascii 12)))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set token-id-to-name token-id token-name)
    (map-set token-name-to-id token-name token-id)
    (ok true)
  )
)

(define-public (set-minimum-valid-signers (minimum uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    
    (var-set minimum-valid-signers minimum)
    (ok true)
  )
)

(define-public (set-trusted-oracle (pubkey (buff 33)) (trusted bool))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set trusted-oracles pubkey trusted)
    (ok true)
  )
)
