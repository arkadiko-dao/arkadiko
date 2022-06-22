(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; for now this is a fairly centralised Oracle, which is subject to failure.
;; Ideally, we implement a Chainlink Price Feed Oracle ASAP
(define-constant ERR-NOT-WHITELISTED u851)
(define-constant ERR-UNTRUSTED-ORACLE u852)
(define-constant ERR-NOT-AUTHORIZED u8401)

(define-data-var oracle-owner principal tx-sender)

(define-constant symbol-stxusd 0x535458555344) ;; "STXUSD" as a buff
(define-constant redstone-value-shift u100000000)
(define-constant stacks-base u1000000)
(define-constant redstone-stacks-base-diff (/ redstone-value-shift stacks-base))

;; A map of all trusted oracles, indexed by their 33 byte compressed public key.
(define-map trusted-oracles (buff 33) bool)
(map-set trusted-oracles 0x035ca791fed34bf9e9d54c0ce4b9626e1382cf13daa46aa58b657389c24a751cc6 true)

(define-read-only (is-trusted-oracle (pubkey (buff 33)))
	(default-to false (map-get? trusted-oracles pubkey))
)

(define-map prices
  { token: (string-ascii 12) }
  {
    last-price: uint,
    last-block: uint,
    decimals: uint
  }
)

(define-public (set-oracle-owner (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set oracle-owner address))
  )
)

(define-public (update-price (token (string-ascii 12)) (price uint) (decimals uint) (timestamp (optional uint)) (signature (optional (buff 65))))
  (begin
    (if (or (is-eq token "STX") (is-eq token "BTC") (is-eq token "xBTC") (is-eq token "XBTC") (is-eq token "xSTX") (is-eq token "XSTX"))
      (update-redstone token price decimals (unwrap-panic timestamp) (unwrap-panic signature))
      (update-custodial token price decimals)
    )
  )
)

(define-private (update-redstone (token (string-ascii 12)) (price uint) (decimals uint) (timestamp uint) (signature (buff 65)))
  (let (
    (signer (try! (contract-call? 'SPDBEG5X8XD50SPM1JJH0E5CTXGDV5NJTKAKKR5V.redstone-verify recover-signer timestamp (list {value: price, symbol: symbol-stxusd}) signature)))
  )
    (asserts! (is-trusted-oracle signer) ERR-UNTRUSTED-ORACLE)

    (ok true)
  )
)

(define-private (update-custodial (token (string-ascii 12)) (price uint) (decimals uint))
  (if (is-eq tx-sender (var-get oracle-owner))
    (begin
      (map-set prices { token: token } { last-price: price, last-block: block-height, decimals: decimals })
      (ok price)
    )
    (err ERR-NOT-WHITELISTED)
  )
)

(define-read-only (get-price (token (string-ascii 12)))
  (unwrap! (map-get? prices { token: token }) { last-price: u0, last-block: u0, decimals: u0 })
)

(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)
