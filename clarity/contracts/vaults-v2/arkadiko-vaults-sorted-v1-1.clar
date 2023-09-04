;; Vaults Sorted 
;; Keep vaults sorted based in NICR (nominal collateral ratio) 
;;

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_INSERTED u920001)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map tokens 
  { 
    token: principal  
  } 
  {
    first-owner: (optional principal),
    last-owner: (optional principal),
    total-vaults: uint
  }
)

(define-map vaults 
  { 
    owner: principal,
    token: principal  
  } 
  {
    prev-owner: (optional principal),
    next-owner: (optional principal),
    nicr: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

(define-read-only (get-token (token principal))
  (default-to
    {
      first-owner: none,
      last-owner: none,
      total-vaults: u0
    }
    (map-get? tokens { token: token })
  )
)

(define-read-only (get-vault (owner principal) (token principal))
  (map-get? vaults { owner: owner, token: token })
)

;; ---------------------------------------------------------
;; Update list
;; ---------------------------------------------------------

(define-public (insert (owner principal) (token principal) (nicr uint) (prev-owner principal) (next-owner principal))
  (let (
    (token-info (get-token token))
    (prev-vault (get-vault prev-owner token))
    (next-vault (get-vault next-owner token))
  )
    ;; TODO: access rights

    ;; List is empty
    (if (and (is-none prev-vault) (is-none next-vault) (is-none (get first-owner token-info)) (is-none (get last-owner token-info)))
      (begin
        (map-set vaults
          { 
            owner: owner,
            token: token
          }
          {
            prev-owner: none,
            next-owner: none,
            nicr: nicr
          }
        )

        (map-set tokens { token: token } (merge token-info { 
          first-owner: (some owner), 
          last-owner: (some owner), 
          total-vaults: (+ (get total-vaults token-info) u1) 
        }))
      )
      false
    )

    ;; First vault
    (if (and (is-none prev-vault) (is-some next-vault) (>= (get nicr (unwrap-panic next-vault)) nicr))
      (begin
        (map-set vaults
          { 
            owner: owner,
            token: token
          }
          {
            prev-owner: none,
            next-owner: (some next-owner),
            nicr: nicr
          }
        )
        (map-set vaults { owner: next-owner, token: token } (merge (unwrap-panic next-vault) { prev-owner: (some owner) }))
        
        (map-set tokens { token: token } (merge token-info { 
          first-owner: (some owner), 
          total-vaults: (+ (get total-vaults token-info) u1) 
        }))
      )
      false
    )

    ;; Last vault
    (if (and (is-some prev-vault) (is-none next-vault) (<= (get nicr (unwrap-panic prev-vault)) nicr))
      (begin
        (map-set vaults
          { 
            owner: owner,
            token: token
          }
          {
            prev-owner: (some prev-owner),
            next-owner: none,
            nicr: nicr
          }
        )
        (map-set vaults { owner: prev-owner, token: token } (merge (unwrap-panic prev-vault) { next-owner: (some owner) }))

        (map-set tokens { token: token } (merge token-info { 
          last-owner: (some owner), 
          total-vaults: (+ (get total-vaults token-info) u1) 
        }))
      )
      false
    )

    ;; Other
    (if (and (is-some prev-vault) (is-some next-vault) (<= (get nicr (unwrap-panic prev-vault)) nicr) (>= (get nicr (unwrap-panic next-vault)) nicr))
      (begin
        (map-set vaults
          { 
            owner: owner,
            token: token
          }
          {
            prev-owner: (some prev-owner),
            next-owner: (some next-owner),
            nicr: nicr
          }
        )
        (map-set vaults { owner: prev-owner, token: token } (merge (unwrap-panic prev-vault) { next-owner: (some owner) }))
        (map-set vaults { owner: next-owner, token: token } (merge (unwrap-panic next-vault) { prev-owner: (some owner) }))

        (map-set tokens { token: token } (merge token-info { 
          total-vaults: (+ (get total-vaults token-info) u1) 
        }))
      )
      false
    )

    ;; Check if vault has been added
    (asserts! (is-some (get-vault owner token)) (err ERR_NOT_INSERTED))

    ;; Result
    (ok (get-token token))
  )
)

(define-public (reinsert (owner principal) (token principal) (nicr uint) (prev-owner principal) (next-owner principal))
  (begin
    ;; TODO: access rights

    (unwrap-panic (remove owner token))
    (insert owner token nicr prev-owner next-owner)
  )
)

(define-public (remove (owner principal) (token principal))
  (let (
    (token-info (get-token token))
    (vault (get-vault owner token))
    (prev-owner (get prev-owner (unwrap-panic vault)))
    (next-owner (get next-owner (unwrap-panic vault)))
  )
    ;; TODO: access rights

    ;; Update prev vault
    (if (is-some prev-owner)
      (let (
        (prev-owner-addr (unwrap-panic prev-owner))
      )
        (map-set vaults { owner: prev-owner-addr, token: token } (merge (unwrap-panic (get-vault prev-owner-addr token)) { next-owner: next-owner }))
      )

      (map-set tokens { token: token } (merge token-info { 
        first-owner: next-owner 
      }))
    )

    ;; Update next vault
    (if (is-some next-owner)
      (let (
        (next-owner-addr (unwrap-panic next-owner))
      )
        (map-set vaults { owner: next-owner-addr, token: token } (merge (unwrap-panic (get-vault next-owner-addr token)) { prev-owner: prev-owner }))
      )

      (map-set tokens { token: token } (merge token-info { 
        last-owner: prev-owner 
      }))
    )

    ;; Remove from map
    (map-delete vaults { owner: owner, token: token })
    (map-set tokens { token: token } (merge token-info { 
      total-vaults: (- (get total-vaults token-info) u1) 
    }))

    ;; Result
    (ok (get-token token))
  )
)
