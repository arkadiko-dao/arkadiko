
(define-data-var first-vault-id (optional uint) none)
(define-data-var last-vault-id (optional uint) none)
(define-data-var total-vaults uint u0)

(define-map vaults { id: uint } {
  prev-id: (optional uint),
  next-id: (optional uint),
  nicr: uint
})

(define-read-only (get-vault (id uint))
  (map-get? vaults { id: id })
)

(define-public (insert (vault-id uint) (nicr uint) (prev-id uint) (next-id uint))
  (let (
    (prev-vault (get-vault prev-id))
    (next-vault (get-vault next-id))
  )

    ;; List is empty
    (if (and (is-none prev-vault) (is-none next-vault) (is-none (var-get first-vault-id)) (is-none (var-get last-vault-id)))
      (begin
        (map-set vaults
          { id: vault-id }
          {
            prev-id: none,
            next-id: none,
            nicr: nicr
          }
        )
        (var-set first-vault-id (some vault-id))
        (var-set last-vault-id (some vault-id))
        (var-set total-vaults (+ (var-get total-vaults) u1))
      )
      false
    )

    ;; First vault
    (if (and (is-none prev-vault) (is-some next-vault) (>= (get nicr (unwrap-panic next-vault)) nicr))
      (begin
        (map-set vaults
          { id: vault-id }
          {
            prev-id: none,
            next-id: (some next-id),
            nicr: nicr
          }
        )
        (map-set vaults { id: next-id } (merge (unwrap-panic next-vault) { prev-id: (some vault-id) }))
        (var-set first-vault-id (some vault-id))
        (var-set total-vaults (+ (var-get total-vaults) u1))
      )
      false
    )

    ;; Last vault
    (if (and (is-some prev-vault) (is-none next-vault) (<= (get nicr (unwrap-panic prev-vault)) nicr))
      (begin
        (map-set vaults
          { id: vault-id }
          {
            prev-id: (some prev-id),
            next-id: none,
            nicr: nicr
          }
        )
        (map-set vaults { id: prev-id } (merge (unwrap-panic prev-vault) { next-id: (some vault-id) }))
        (var-set last-vault-id (some vault-id))
        (var-set total-vaults (+ (var-get total-vaults) u1))
      )
      false
    )

    ;; Other
    (if (and (is-some prev-vault) (is-some next-vault) (<= (get nicr (unwrap-panic prev-vault)) nicr) (>= (get nicr (unwrap-panic next-vault)) nicr))
      (begin
        (map-set vaults
          { id: vault-id }
          {
            prev-id: (some prev-id),
            next-id: (some next-id),
            nicr: nicr
          }
        )
        (map-set vaults { id: prev-id } (merge (unwrap-panic prev-vault) { next-id: (some vault-id) }))
        (map-set vaults { id: next-id } (merge (unwrap-panic next-vault) { prev-id: (some vault-id) }))
        (var-set total-vaults (+ (var-get total-vaults) u1))
      )
      false
    )

    ;; Result
    (ok { 
      success: (is-some (get-vault vault-id)),
      total-vaults: (var-get total-vaults), 
      first-vault-id: (var-get first-vault-id), 
      last-vault-id: (var-get last-vault-id)
    })
  )
)

(define-public (reinsert (vault-id uint) (nicr uint) (prev-id uint) (next-id uint))
  (begin
    (unwrap-panic (remove vault-id))
    (insert vault-id nicr prev-id next-id)
  )
)

(define-public (remove (vault-id uint))
  (let (
    (vault (get-vault vault-id))
    (prev-id (get prev-id (unwrap-panic vault)))
    (next-id (get next-id (unwrap-panic vault)))
  )
    ;; Update prev vault
    (if (is-some prev-id)
      (map-set vaults { id: (unwrap-panic prev-id) } (merge (unwrap-panic (get-vault (unwrap-panic prev-id))) { next-id: next-id }))
      (var-set first-vault-id (get next-id (unwrap-panic vault)))
    )

    ;; Update next vault
    (if (is-some next-id)
      (map-set vaults { id: (unwrap-panic next-id) } (merge (unwrap-panic (get-vault (unwrap-panic next-id))) { prev-id: prev-id }))
      (var-set last-vault-id (get prev-id (unwrap-panic vault)))
    )

    ;; Remove from map
    (map-delete vaults { id: vault-id })
    (var-set total-vaults (- (var-get total-vaults) u1))

    ;; Result
    (ok { 
      total-vaults: (var-get total-vaults), 
      first-vault-id: (var-get first-vault-id), 
      last-vault-id: (var-get last-vault-id)
    })
  )
)
