
(define-data-var first-vault-id uint u0)
(define-data-var last-vault-id uint u0)

(define-data-var total-vaults uint u0)

(define-map vaults { id: uint } {
  prev-id: uint,
  next-id: uint,
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
    (if (and (is-none prev-vault) (is-none next-vault) (is-eq (var-get first-vault-id) u0) (is-eq (var-get last-vault-id) u0))
      (begin
        (map-set vaults
          { id: vault-id }
          {
            prev-id: prev-id,
            next-id: next-id,
            nicr: nicr
          }
        )
        (var-set first-vault-id vault-id)
        (var-set last-vault-id vault-id)
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
            prev-id: u0,
            next-id: next-id,
            nicr: nicr
          }
        )
        (map-set vaults { id: next-id } (merge (unwrap-panic next-vault) { prev-id: vault-id }))
        (var-set first-vault-id vault-id)
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
            prev-id: prev-id,
            next-id: u0,
            nicr: nicr
          }
        )
        (map-set vaults { id: prev-id } (merge (unwrap-panic prev-vault) { next-id: vault-id }))
        (var-set last-vault-id vault-id)
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
            prev-id: prev-id,
            next-id: next-id,
            nicr: nicr
          }
        )
        (map-set vaults { id: prev-id } (merge (unwrap-panic prev-vault) { next-id: vault-id }))
        (map-set vaults { id: next-id } (merge (unwrap-panic next-vault) { prev-id: vault-id }))
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
    (prev-vault (get-vault (get prev-id (unwrap-panic vault))))
    (next-vault (get-vault (get next-id (unwrap-panic vault))))
  )
    ;; Update prev vault
    (if (is-some prev-vault)
      (map-set vaults { id: (get prev-id (unwrap-panic vault)) } (merge (unwrap-panic prev-vault) { next-id: (get next-id (unwrap-panic vault)) }))
      (var-set first-vault-id (get next-id (unwrap-panic vault)))
    )

    ;; Update next vault
    (if (is-some next-vault)
      (map-set vaults { id: (get next-id (unwrap-panic vault)) } (merge (unwrap-panic next-vault) { prev-id: (get prev-id (unwrap-panic vault)) }))
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
