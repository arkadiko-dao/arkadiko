;; @contract Arkadiko multisig oracle
;; @version 2.3

(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED u8501)
(define-constant ERR-PRICE-NOT-FOUND u8502)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var manual-manager principal (contract-call? .arkadiko-dao get-dao-owner))

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map prices-pyth
  { token: (string-ascii 12) }
  {
    decimals: uint,
    feed-id: (buff 32),
  }
)

(define-map prices-dia
  { token: (string-ascii 12) }
  {
    decimals: uint,
    key: (string-ascii 32),
  }
)

(define-map prices-custom
  { token: (string-ascii 12) }
  {
    decimals: uint,
    key: (string-ascii 32),
  }
)

(define-map prices-manual
  { token: (string-ascii 12) }
  {
    decimals: uint,
    price: uint,
  }
)

;; ---------------------------------------------------------
;; Trait Implementation
;; ---------------------------------------------------------

(define-public (get-price (token (string-ascii 12)))
  (fetch-price token)
)

(define-public (fetch-price (token (string-ascii 12)))
  (let (
    (manual-result (get-manual-info token))
  )
    (if (is-ok manual-result)
      manual-result
      (let (
        (pyth-result (get-pyth-info token))
      )
        (if (is-ok pyth-result)
          pyth-result
          (let (
            (dia-result (get-dia-info token))
          )
            (if (is-ok dia-result)
              dia-result
              (get-custom-info token)
            )
          )
        )
      )
    )
  )
)

;; ---------------------------------------------------------
;; Price Helpers
;; ---------------------------------------------------------

(define-public (get-pyth-info (token (string-ascii 12)))
  (let (
    (price-info (map-get? prices-pyth { token: token }))
  )
    (if (is-some price-info)
      (let (
        (price (try! (get-price-pyth (get feed-id (unwrap-panic price-info)))))
        (decimals (get decimals (unwrap-panic price-info)))
      )
        (ok { last-price: price, last-block: burn-block-height, decimals: decimals })
      )
      (err ERR-PRICE-NOT-FOUND)
    )
  )
)

(define-public (get-dia-info (token (string-ascii 12)))
  (let (
    (price-info (map-get? prices-dia { token: token }))
  )
    (if (is-some price-info)
      (let (
        (price (unwrap-panic (get-price-dia (get key (unwrap-panic price-info)))))
        (decimals (get decimals (unwrap-panic price-info)))
      )
        (ok { last-price: price, last-block: burn-block-height, decimals: decimals })
      )
      (err ERR-PRICE-NOT-FOUND)
    )
  )
)

(define-public (get-custom-info (token (string-ascii 12)))
  (let (
    (price-info (map-get? prices-custom { token: token }))
  )
    (if (is-some price-info)
      (let (
        (price (try! (get-price-custom (get key (unwrap-panic price-info)))))
        (decimals (get decimals (unwrap-panic price-info)))
      )
        (ok { last-price: price, last-block: burn-block-height, decimals: decimals })
      )
      (err ERR-PRICE-NOT-FOUND)
    )
  )
)

(define-public (get-manual-info (token (string-ascii 12)))
  (let (
    (price-info (map-get? prices-manual { token: token }))
  )
    (if (is-some price-info)
      (let (
        (price (get price (unwrap-panic price-info)))
        (decimals (get decimals (unwrap-panic price-info)))
      )
        (ok { last-price: price, last-block: burn-block-height, decimals: decimals })
      )
      (err ERR-PRICE-NOT-FOUND)
    )
  )
)


;; ---------------------------------------------------------
;; Oracles
;; ---------------------------------------------------------

(define-public (get-price-pyth (price-feed-id (buff 32)))
  (let (

    ;; TODO: Update for mainnet
    ;; (storage 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-storage-v3)
    ;; (oracle-data (try! (contract-call? 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-oracle-v3 get-price price-feed-id storage)))

    (storage .pyth-storage-v3)
    (oracle-data (try! (contract-call? .pyth-oracle-v3 get-price price-feed-id storage)))
  )
    (ok (to-uint (get price oracle-data)))
  )
)

(define-public (get-price-dia (key (string-ascii 32)))
  (let (
    ;; TODO: Update for mainnet
    ;; (oracle-data (unwrap-panic (contract-call? 'SP1G48FZ4Y7JY8G2Z0N51QTCYGBQ6F4J43J77BQC0.dia-oracle get-value key)))
    (oracle-data (unwrap-panic (contract-call? .dia-oracle get-value key)))
  )
    (ok (get value oracle-data))
  )
)

;; ---------------------------------------------------------
;; Custom
;; ---------------------------------------------------------

(define-public (get-price-custom (key (string-ascii 32)))
  (if (is-eq key "stSTX/USD")
    (get-price-ststx)
    (err ERR-PRICE-NOT-FOUND)
  )
)

(define-public (get-price-ststx)
  (let (
    (stx-price (try! (get-price-pyth 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)))
    (ststx-reserve 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1)
    ;; TODO: Update for mainnet
    ;; (ratio (try! (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v3 get-stx-per-ststx ststx-reserve)))
    (ratio (try! (contract-call? .data-core-v3 get-stx-per-ststx ststx-reserve)))
  )
    (ok (/ (* stx-price (* ratio u100)) u100000000))
  )
)

;; ---------------------------------------------------------
;; Manual
;; ---------------------------------------------------------

(define-public (update-price-manual (token (string-ascii 12)) (decimals uint) (price uint))
  (begin
    (asserts! (is-eq tx-sender (var-get manual-manager)) (err ERR-NOT-AUTHORIZED))
    (map-set prices-manual { token: token } { decimals: decimals, price: price })
    (ok price)
  )
)

(define-public (set-manual-manager (new-manager principal))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set manual-manager new-manager)
    (ok new-manager)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-pyth-price (token (string-ascii 12)) (decimals uint) (feed-id (buff 32)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-set prices-pyth { token: token } { decimals: decimals, feed-id: feed-id })
    (ok feed-id)
  )
)

(define-public (remove-pyth-price (token (string-ascii 12)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-delete prices-pyth { token: token })
    (ok token)
  )
)

(define-public (set-dia-price (token (string-ascii 12)) (decimals uint) (key (string-ascii 32)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-set prices-dia { token: token } { decimals: decimals, key: key })
    (ok key)
  )
)

(define-public (remove-dia-price (token (string-ascii 12)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-delete prices-dia { token: token })
    (ok token)
  )
)

(define-public (set-custom-price (token (string-ascii 12)) (decimals uint) (key (string-ascii 32)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-set prices-custom { token: token } { decimals: decimals, key: key })
    (ok key)
  )
)

(define-public (remove-custom-price (token (string-ascii 12)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-delete prices-custom { token: token })
    (ok token)
  )
)

(define-public (set-manual-price (token (string-ascii 12)) (decimals uint) (price uint))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-set prices-manual { token: token } { decimals: decimals, price: price })
    (ok price)
  )
)

(define-public (remove-manual-price (token (string-ascii 12)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))
    (map-delete prices-manual { token: token })
    (ok token)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

;; Oracle prices are standardized to 8 decimal places (100000000).
;; For tokens with 6 decimals (like STX), we divide by 100000000 to normalize.
;; For tokens with 8 decimals (like xBTC/sBTC), we divide by an additional 100 in the Arkadiko protocol to account for the extra precision.

(define-constant decimals8 u100000000)

(begin
  (map-set prices-pyth { token: "STX" } { decimals: decimals8, feed-id: 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 })
  (map-set prices-pyth { token: "xSTX" } { decimals: decimals8, feed-id: 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 })

  (map-set prices-pyth { token: "BTC" } { decimals: (* decimals8 u100), feed-id: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 })
  (map-set prices-pyth { token: "xBTC" } { decimals: (* decimals8 u100), feed-id: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 })
  (map-set prices-pyth { token: "sBTC" } { decimals: (* decimals8 u100), feed-id: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 })

  (map-set prices-custom { token: "stSTX" } { decimals: decimals8, key: "stSTX/USD" })
  (map-set prices-custom { token: "ststx-token" } { decimals: decimals8, key: "stSTX/USD" })

  (map-set prices-dia { token: "DIKO" } { decimals: decimals8, key: "DIKO/USD" })
  (map-set prices-dia { token: "WELSH" } { decimals: decimals8, key: "WELSH/USD" })
)
