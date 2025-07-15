
(define-constant ERR_PRICE_FEED_NOT_FOUND (err u5004))

(define-map prices (buff 32) {
  price: int,
  conf: uint,
  expo: int,
  ema-price: int,
  ema-conf: uint,
  publish-time: uint,
  prev-publish-time: uint,
})

(define-public (get-price (price-feed-id (buff 32)) (pyth-storage-address principal)) 
  (let (
    (entry (unwrap! (map-get? prices price-feed-id) ERR_PRICE_FEED_NOT_FOUND))
  )
    (ok entry)
  )
)

(define-public (set-price (price-feed-id (buff 32)) (price int))
  (begin
    (map-set prices 
      price-feed-id
      { price: price, conf: u0, expo: 0, ema-price: 0, ema-conf: u0, publish-time: u0, prev-publish-time: u0 }
    )
    (ok true)
  )
)
