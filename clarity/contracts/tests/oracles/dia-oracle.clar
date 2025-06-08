
(define-map values (string-ascii 32)
  { value: uint, timestamp: uint }
)

(define-read-only (get-value (key (string-ascii 32)))
  (ok (default-to { value: u0, timestamp: u0 } (map-get? values key)))
)

(define-public (set-value (key (string-ascii 32)) (value uint))
  (begin
    (map-set values 
      key
      { value: value, timestamp: u0 }
    )
    (ok true)
  )
)
