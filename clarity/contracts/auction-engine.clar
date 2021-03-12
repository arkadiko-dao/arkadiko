;; addresses
(define-constant stx-liquidation-reserve 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE)

(define-map auctions { id: uint } { id: uint, ustx-amount: uint, debt-to-raise: uint, vault-id: uint, is-open: bool })
(define-data-var last-auction-id uint u0)
(define-data-var auction-ids (list 2000 uint) (list u0))

(define-read-only (get-auction-by-id (id uint))
  (unwrap!
    (map-get? auctions { id: id })
    (tuple (id u0) (ustx-amount u0) (debt-to-raise u0) (vault-id u0) (is-open false))
  )
)

(define-read-only (get-auction-id)
  (ok (var-get auction-ids))
)

(define-read-only (get-auctions)
  (ok (map get-auction-by-id (var-get auction-ids)))
)

;; stx-collateral has been posted in stx-liquidation-reserve principal
;; 1. Create auction object in map
;; 2. Add auction ID to list (to show in UI)
(define-public (start-auction (ustx-amount uint) (vault-id uint))
  (let ((auction-id (+ (var-get last-auction-id) u1)))
    (map-set auctions
      { id: auction-id }
      { id: auction-id, ustx-amount: ustx-amount, debt-to-raise: u10, vault-id: vault-id, is-open: true }
    )
    (print "Added new open auction")
    (var-set auction-ids (unwrap-panic (as-max-len? (append (var-get auction-ids) auction-id) u2000)))
    (ok true)
  )
)
