;; @contract Arkadiko multisig oracle
;; @version 2.3

(impl-trait .arkadiko-oracle-trait-v1.oracle-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR-NOT-AUTHORIZED u8501)
(define-constant ERR-PRICE-NOT-FOUND u8502)

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

;; ---------------------------------------------------------
;; Trait Implementation
;; ---------------------------------------------------------

(define-read-only (get-price (token (string-ascii 12)))
  (let (
    (pyth-price (map-get? prices-pyth { token: token }))
    (dia-price (map-get? prices-dia { token: token }))
    (custom-price (map-get? prices-custom { token: token }))

    (price 
      (if pyth-price (get-price-pyth (get feed-id pyth-price))
      (if dia-price (get-price-dia (get key dia-price))
      (if custom-price (get-price-custom (get key custom-price))
        (err ERR-PRICE-NOT-FOUND)
      )))
    )

    (decimals 
      (if pyth-price (get decimals pyth-price)
      (if dia-price (get decimals dia-price)
      (if custom-price (get decimals custom-price)
        (err ERR-PRICE-NOT-FOUND)
      )))
    )
  )
    { last-price: price, last-block: burn-block-height, decimals: decimals }
  )
)

(define-public (fetch-price (token (string-ascii 12)))
  (ok (get-price token))
)

;; ---------------------------------------------------------
;; Oracles
;; ---------------------------------------------------------

(define-read-only (get-price-pyth (price-feed-id (buff 32)))
  (let (
    (storage 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-storage-v3)
    (oracle-data (try! (contract-call? 'SP3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-oracle-v3 get-price price-feed-id storage)))
  )
    (get price oracle-data)
  )
)

(define-read-only (get-price-dia (key (string-ascii 32)))
  (let (
    (oracle-data (unwrap-panic (contract-call? 'SP1G48FZ4Y7JY8G2Z0N51QTCYGBQ6F4J43J77BQC0.dia-oracle get-value key)))
  )
    (get value oracle-data)
  )
)

(define-read-only (get-price-custom (key (string-ascii 32)))
  (if (is-eq key "stSTX/USD")
    (get-price-ststx)
    (err ERR-PRICE-NOT-FOUND)
  )
)

;; ---------------------------------------------------------
;; Custom
;; ---------------------------------------------------------

(define-read-only (get-price-ststx)
  (let (
    (stx-price (get-price-pyth 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17))
    (ststx-reserve 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1)
    (ratio (try! (contract-call? 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v2 get-stx-per-ststx reseve)))
  )
    (/ (* stx-price ratio) u1000000)  
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  (map-set prices-pyth "STX" u1000000 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)
  (map-set prices-pyth "xSTX" u1000000 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)

  (map-set prices-pyth "BTC" u10000000000 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
  (map-set prices-pyth "xBTC" u10000000000 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)
  (map-set prices-pyth "sBTC" u10000000000 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)

  (map-set prices-custom "stSTX" u100000000 "stSTX/USD")
  (map-set prices-custom "ststx-token" u100000000 "stSTX/USD")

  (map-set prices-dia "DIKO" u100000000 "DIKO/USD")
  (map-set prices-dia "WELSH" u100000000 "WELSH/USD")
)
