;; Vaults Sorted 
;; Keep vaults sorted based in NICR (nominal collateral ratio) 
;;

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u960401)
(define-constant ERR_WRONG_POSITION u960001)

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

(define-read-only (has-access (caller principal))
  (or
    (is-eq caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
    (is-eq caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
    (is-eq caller (contract-call? .arkadiko-dao get-dao-owner))
  )
)

;; ---------------------------------------------------------
;; Find position
;; ---------------------------------------------------------

;; TODO: check the cost
;; Find the actual position given prev/next hints.
;; Hints are kept off chain. But the list can change within the same block.
;; So we use the prev/next hints to find the actual position. 
(define-read-only (find-position (owner principal) (token principal) (nicr uint) (prev-owner-hint (optional principal)) (next-owner-hint (optional principal)))
  (let (
    (prev-owner-1 (if (is-some prev-owner-hint) (unwrap-panic (get prev-owner (get-vault (unwrap-panic prev-owner-hint) token))) none))
    (prev-owner-2 (if (is-some prev-owner-1) (unwrap-panic (get prev-owner (get-vault (unwrap-panic prev-owner-1) token))) none))
    (prev-owner-3 (if (is-some prev-owner-2) (unwrap-panic (get prev-owner (get-vault (unwrap-panic prev-owner-2) token))) none))
    (prev-owner-4 (if (is-some prev-owner-3) (unwrap-panic (get prev-owner (get-vault (unwrap-panic prev-owner-3) token))) none))
    (prev-owner-5 (if (is-some prev-owner-4) (unwrap-panic (get prev-owner (get-vault (unwrap-panic prev-owner-4) token))) none))

    (next-owner-1 (if (is-some next-owner-hint) (unwrap-panic (get next-owner (get-vault (unwrap-panic next-owner-hint) token))) none))
    (next-owner-2 (if (is-some next-owner-1) (unwrap-panic (get next-owner (get-vault (unwrap-panic next-owner-1) token))) none))
    (next-owner-3 (if (is-some next-owner-2) (unwrap-panic (get next-owner (get-vault (unwrap-panic next-owner-2) token))) none))
    (next-owner-4 (if (is-some next-owner-3) (unwrap-panic (get next-owner (get-vault (unwrap-panic next-owner-3) token))) none))
    (next-owner-5 (if (is-some next-owner-4) (unwrap-panic (get next-owner (get-vault (unwrap-panic next-owner-4) token))) none))
  )
    ;; First check if given prev/next is correct
    (if (get correct (check-position owner token nicr prev-owner-hint next-owner-hint)) { prev: prev-owner-hint, next: next-owner-hint }

    (if (get correct (check-position owner token nicr prev-owner-1 prev-owner-hint)) { prev: prev-owner-1, next: prev-owner-hint }
    (if (get correct (check-position owner token nicr next-owner-hint next-owner-1)) { prev: next-owner-hint, next: next-owner-1 }

    (if (get correct (check-position owner token nicr prev-owner-2 prev-owner-1)) { prev: prev-owner-2, next: prev-owner-1 }
    (if (get correct (check-position owner token nicr next-owner-1 next-owner-2)) { prev: next-owner-1, next: next-owner-2 }

    (if (get correct (check-position owner token nicr prev-owner-3 prev-owner-2)) { prev: prev-owner-3, next: prev-owner-2 }
    (if (get correct (check-position owner token nicr next-owner-2 next-owner-3)) { prev: next-owner-2, next: next-owner-3 }

    (if (get correct (check-position owner token nicr prev-owner-4 prev-owner-3)) { prev: prev-owner-4, next: prev-owner-3 }
    (if (get correct (check-position owner token nicr next-owner-3 next-owner-4)) { prev: next-owner-3, next: next-owner-4 }

    (if (get correct (check-position owner token nicr prev-owner-5 prev-owner-4)) { prev: prev-owner-5, next: prev-owner-4 }
    (if (get correct (check-position owner token nicr next-owner-4 next-owner-5)) { prev: next-owner-4, next: next-owner-5 }

      ;; Didn't find a valid position
      { prev: none, next: none }
    )))))))))))    
  )
)

;; Check if position is correct
(define-read-only (check-position (owner principal) (token principal) (nicr uint) (prev-owner (optional principal)) (next-owner (optional principal)))
  (let (
    (token-info (get-token token))
  )
    ;; List empty - position always correct
    (if (and (is-none (get first-owner token-info)) (is-none (get last-owner token-info)))
      { correct: true, first: true, last: true }

      (let (
        (first-owner (unwrap-panic (get first-owner token-info)))
        (last-owner (unwrap-panic (get last-owner token-info)))
      )
        ;; First element in list - check nicr first element
        (if (<= nicr (get nicr (unwrap-panic (get-vault first-owner token))))
          { correct: true, first: true, last: false }

          ;; Last element in list - check nicr last element
          (if (>= nicr (get nicr (unwrap-panic (get-vault last-owner token))))
            { correct: true, first: false, last: true }

            ;; Middle element in list - check given prev/next
            (if (and 
              (is-some prev-owner) 
              (is-some next-owner) 
              (<= (get nicr (unwrap-panic (get-vault (unwrap-panic prev-owner) token))) nicr) 
              (>= (get nicr (unwrap-panic (get-vault (unwrap-panic next-owner) token))) nicr) 
            )
              { correct: true, first: false, last: false }

              ;; None of the above - wrong position
              { correct: false, first: false, last: false }
            )
          )
        )
      )
    )
  )
)

;; ---------------------------------------------------------
;; Update list
;; ---------------------------------------------------------

(define-public (insert (owner principal) (token principal) (nicr uint) (prev-owner-hint (optional principal)) (next-owner-hint (optional principal)))
  (let (
    (token-info (get-token token))

    (position-find (find-position owner token nicr prev-owner-hint next-owner-hint))
    (prev-owner (get prev position-find))
    (next-owner (get next position-find))

    (position-check (check-position owner token nicr prev-owner next-owner))
  )
    (asserts! (has-access contract-caller) (err ERR_NOT_AUTHORIZED))
    (asserts! (get correct position-check) (err ERR_WRONG_POSITION))

    ;; Add new vault
    (map-set vaults
      { 
        owner: owner,
        token: token
      }
      {
        prev-owner: prev-owner,
        next-owner: next-owner,
        nicr: nicr
      }
    )

    ;; Update prev/next vault
    (if (is-some prev-owner)
      (map-set vaults { owner: (unwrap-panic prev-owner), token: token } 
        (merge (unwrap-panic (get-vault (unwrap-panic prev-owner) token)) { next-owner: (some owner) })
      )
      false
    )
    (if (is-some next-owner)
      (map-set vaults { owner: (unwrap-panic next-owner), token: token } 
        (merge (unwrap-panic (get-vault (unwrap-panic next-owner) token)) { prev-owner: (some owner) })
      )
      false
    )

    ;; Update token info
    (map-set tokens { token: token } { 
      first-owner: (if (get first position-check) (some owner) (get first-owner token-info)), 
      last-owner: (if (get last position-check) (some owner) (get last-owner token-info)), 
      total-vaults: (+ (get total-vaults token-info) u1) 
    })

    ;; Return token info
    (ok (get-token token))
  )
)

(define-public (reinsert (owner principal) (token principal) (nicr uint) (prev-owner-hint (optional principal)) (next-owner-hint (optional principal)))
  (begin
    (asserts! (has-access contract-caller) (err ERR_NOT_AUTHORIZED))

    (unwrap-panic (remove owner token))
    (insert owner token nicr prev-owner-hint next-owner-hint)
  )
)

(define-public (remove (owner principal) (token principal))
  (let (
    (token-info (get-token token))
    (vault (get-vault owner token))
    (prev-owner (get prev-owner (unwrap-panic vault)))
    (next-owner (get next-owner (unwrap-panic vault)))
  )
    (asserts! (has-access contract-caller) (err ERR_NOT_AUTHORIZED))

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

    ;; Return token info
    (ok (get-token token))
  )
)
