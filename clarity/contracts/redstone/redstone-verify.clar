;; RedStone Clarity Connector project.
;; The redstone-verify contract is a stateless library contract that other
;; contracts can call into to verify RedStone messages.
;; By Marvin Janssen

(define-constant eth-personal-sign-prefix 0x19457468657265756D205369676E6564204D6573736167653A0A3332)
(define-constant redstone-value-shift u100000000)

;; Timestamp is ceiled, so we need this structure.
(define-read-only (shift-timestamp (timestamp uint))
	(if (> (mod timestamp u1000) u0)
		(+ (/ timestamp u1000) u1)
		(/ timestamp u1000)
	)
)

(define-read-only (get-redstone-value-shift)
	redstone-value-shift
)

(define-private (assemble-iter (entry {symbol: (buff 32), value: uint}) (a (buff 640)))
	(unwrap-panic (as-max-len? (concat a (concat (right-pad32 (get symbol entry)) (uint256-to-buff-be (get value entry)))) u640))
)

(define-read-only (generate-signable-message-hash (timestamp uint) (entries (list 10 {symbol: (buff 32), value: uint})))
	(keccak256
		(concat
			eth-personal-sign-prefix
			(keccak256 (concat (fold assemble-iter entries 0x) (uint256-to-buff-be (shift-timestamp timestamp))))
		)
	)
)

(define-read-only (generate-lite-data-bytes (timestamp uint) (entries (list 10 {symbol: (buff 32), value: uint})))
	(concat (fold assemble-iter entries 0x) (uint256-to-buff-be (shift-timestamp timestamp)))
)

(define-read-only (verify-message (timestamp uint) (entries (list 10 {symbol: (buff 32), value: uint})) (signature (buff 65)) (public-key (buff 33)))
	(secp256k1-verify (generate-signable-message-hash timestamp entries) signature public-key)
)

(define-read-only (recover-signer (timestamp uint) (entries (list 10 {symbol: (buff 32), value: uint})) (signature (buff 65)))
	(secp256k1-recover? (generate-signable-message-hash timestamp entries) signature)
)

(define-private (recover-signer-hash (hash (buff 32)) (signature (buff 65)))
	(secp256k1-recover? hash signature)
)

(define-read-only (recover-signer-multi (timestamp uint) (entries (list 10 {symbol: (buff 32), value: uint})) (signatures (list 8 (buff 65))))
	(let ((hash (generate-signable-message-hash timestamp entries)))
		(map recover-signer-hash (list hash hash hash hash hash hash hash hash) signatures)
	)
)

(define-constant byte-list 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff)

(define-private (uint-to-buff-iter (b (buff 1)) (p {n: uint, a: (buff 32)}))
	{
		a: (unwrap-panic (as-max-len? (concat (if (is-eq (get n p) u0) 0x00 (unwrap-panic (element-at byte-list (mod (get n p) u256)))) (get a p)) u32)),
		n: (/ (get n p) u256)
	}
)

(define-read-only (uint256-to-buff-be (n uint))
	(unwrap-panic (as-max-len? (get a (fold uint-to-buff-iter 0x0000000000000000000000000000000000000000000000000000000000000000 {n: n, a: 0x})) u32))
)

(define-constant pad32-padding (list
	0x0000000000000000000000000000000000000000000000000000000000000000
	0x00000000000000000000000000000000000000000000000000000000000000
	0x000000000000000000000000000000000000000000000000000000000000
	0x0000000000000000000000000000000000000000000000000000000000
	0x00000000000000000000000000000000000000000000000000000000
	0x000000000000000000000000000000000000000000000000000000
	0x0000000000000000000000000000000000000000000000000000
	0x00000000000000000000000000000000000000000000000000
	0x000000000000000000000000000000000000000000000000
	0x0000000000000000000000000000000000000000000000
	0x00000000000000000000000000000000000000000000
	0x000000000000000000000000000000000000000000
	0x0000000000000000000000000000000000000000
	0x00000000000000000000000000000000000000
	0x000000000000000000000000000000000000
	0x0000000000000000000000000000000000
	0x00000000000000000000000000000000
	0x000000000000000000000000000000
	0x0000000000000000000000000000
	0x00000000000000000000000000
	0x000000000000000000000000
	0x0000000000000000000000
	0x00000000000000000000
	0x000000000000000000
	0x0000000000000000
	0x00000000000000
	0x000000000000
	0x0000000000
	0x00000000
	0x000000
	0x0000
	0x00
	0x
))

(define-read-only (right-pad32 (b (buff 32)))
	(concat b (unwrap-panic (element-at pad32-padding (len b))))
)