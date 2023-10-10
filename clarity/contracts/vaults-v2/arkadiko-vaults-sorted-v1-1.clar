;; Vaults Sorted 
;; Keep vaults sorted based in NICR (nominal collateral ratio) 
;;

(impl-trait .arkadiko-vaults-sorted-trait-v1-1.vaults-sorted-trait)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u960401)
(define-constant ERR_WRONG_POSITION u960001)
(define-constant ERR_VAULT_ALREADY_INSERTED u960002)
(define-constant ERR_VAULT_UNKNOWN u960003)

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
  (ok (default-to
    {
      first-owner: none,
      last-owner: none,
      total-vaults: u0
    }
    (map-get? tokens { token: token })
  ))
)

(define-read-only (get-vault (owner principal) (token principal))
  (map-get? vaults { owner: owner, token: token })
)

(define-read-only (has-access)
  (or
    (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-operations")))
    (is-eq contract-caller (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "vaults-manager")))
    (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner))
  )
)

;; ---------------------------------------------------------
;; Find position
;; ---------------------------------------------------------

(define-read-only (get-prev-owner (owner (optional principal)) (token principal)) 
  (let (
    (prev-vault (if (is-some owner) (get prev-owner (get-vault (unwrap-panic owner) token)) none))
    (prev-owner (if (is-some prev-vault) (unwrap-panic prev-vault) none))
  )
    prev-owner
  )
)

(define-read-only (get-next-owner (owner (optional principal)) (token principal)) 
  (let (
    (next-vault (if (is-some owner) (get next-owner (get-vault (unwrap-panic owner) token)) none))
    (next-owner (if (is-some next-vault) (unwrap-panic next-vault) none))
  )
    next-owner
  )
)

;; Find the actual position given prev/next hints.
;; Hints are kept off chain. But the list can change within the same block.
;; So we use the prev/next hints to find the actual position. 
(define-read-only (find-position (owner principal) (token principal) (nicr uint) (prev-owner-hint (optional principal)))
  (begin
    (let (
      (check-pos-1 (check-position owner token nicr prev-owner-hint)) 
      (next-owner (get-next-owner prev-owner-hint token))
    ) (if (get correct check-pos-1) check-pos-1
    (let (
      (check-pos-2 (check-position owner token nicr next-owner)) 
      (prev-owner-1 (get-prev-owner prev-owner-hint token))
    ) (if (get correct check-pos-2) check-pos-2
    (let (
      (check-pos-3 (check-position owner token nicr prev-owner-1)) 
      (next-owner-1 (get-next-owner next-owner token))
    ) (if (get correct check-pos-3) check-pos-3
    (let (
      (check-pos-4 (check-position owner token nicr next-owner-1)) 
      (prev-owner-2 (get-prev-owner prev-owner-1 token))
    ) (if (get correct check-pos-4) check-pos-4
    (let (
      (check-pos-5 (check-position owner token nicr prev-owner-2)) 
      (next-owner-2 (get-next-owner next-owner-1 token))
    ) (if (get correct check-pos-5) check-pos-5
    (let (
      (check-pos-6 (check-position owner token nicr next-owner-2)) 
      (prev-owner-3 (get-prev-owner prev-owner-2 token))
    ) (if (get correct check-pos-6) check-pos-6
    (let (
      (check-pos-7 (check-position owner token nicr prev-owner-3)) 
      (next-owner-3 (get-next-owner next-owner-2 token))
    ) (if (get correct check-pos-7) check-pos-7
    (let (
      (check-pos-8 (check-position owner token nicr next-owner-3)) 
      (prev-owner-4 (get-prev-owner prev-owner-3 token))
    ) (if (get correct check-pos-8) check-pos-8
    (let (
      (check-pos-9 (check-position owner token nicr prev-owner-4)) 
      (next-owner-4 (get-next-owner next-owner-3 token))
    ) (if (get correct check-pos-9) check-pos-9
    (let (
      (check-pos-10 (check-position owner token nicr next-owner-4))
    ) (if (get correct check-pos-10) check-pos-10

      { correct: false, first: false, last: false, prev: none, next: none }
    ))))))))))))))))))))
  )
)

;; Check if given position is correct
(define-read-only (check-position (owner principal) (token principal) (nicr uint) (prev-owner (optional principal)))
  (let (
    (token-info (unwrap-panic (get-token token)))
    (next-owner (get-next-owner prev-owner token))
  )
    ;; List empty - position always correct
    (if (and (is-none (get first-owner token-info)) (is-none (get last-owner token-info)))
      { correct: true, first: true, last: true, prev: none, next: none }

      (let (
        (first-owner (unwrap-panic (get first-owner token-info)))
        (last-owner (unwrap-panic (get last-owner token-info)))
      )
        ;; First element in list - check nicr first element
        (if (<= nicr (get nicr (unwrap-panic (get-vault first-owner token))))
          { correct: true, first: true, last: false, prev: none, next: (some first-owner) }

          ;; Last element in list - check nicr last element
          (if (>= nicr (get nicr (unwrap-panic (get-vault last-owner token))))
            { correct: true, first: false, last: true, prev: (some last-owner), next: none }

            ;; Middle element in list - check given prev/next
            (if (and 
              (is-some prev-owner) 
              (is-some next-owner) 
              (<= (get nicr (unwrap-panic (get-vault (unwrap-panic prev-owner) token))) nicr) 
              (>= (get nicr (unwrap-panic (get-vault (unwrap-panic next-owner) token))) nicr) 
            )
              { correct: true, first: false, last: false, prev: prev-owner, next: next-owner }

              ;; None of the above - wrong position
              { correct: false, first: false, last: false, prev: none, next: none }
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

;; Insert new vault in list
;; Given prev/next hints
(define-public (insert (owner principal) (token principal) (nicr uint) (prev-owner-hint (optional principal)))
  (let (
    (token-info (unwrap-panic (get-token token)))

    (position-find (find-position owner token nicr prev-owner-hint))
    (prev-owner (get prev position-find))
    (next-owner (get next position-find))
  )
    (asserts! (has-access) (err ERR_NOT_AUTHORIZED))
    (asserts! (get correct position-find) (err ERR_WRONG_POSITION))
    (asserts! (is-none (get-vault owner token)) (err ERR_VAULT_ALREADY_INSERTED))

    ;; Add new vault
    (map-set vaults { owner: owner, token: token }
      { prev-owner: prev-owner, next-owner: next-owner, nicr: nicr }
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
      first-owner: (if (get first position-find) (some owner) (get first-owner token-info)), 
      last-owner: (if (get last position-find) (some owner) (get last-owner token-info)), 
      total-vaults: (+ (get total-vaults token-info) u1) 
    })

    (print { action: "vaults-list-insert", owner: owner, token: token, nicr: nicr, prev-owner: prev-owner, next-owner: next-owner })

    ;; Return token info
    (ok (unwrap-panic (get-token token)))
  )
)

;; Reinsert vault in list
(define-public (reinsert (owner principal) (token principal) (nicr uint) (prev-owner-hint (optional principal)))
  (begin
    (try! (remove owner token))
    (insert owner token nicr prev-owner-hint)
  )
)

;; Remove vault from list
(define-public (remove (owner principal) (token principal))
  (let (
    (token-info (unwrap-panic (get-token token)))
    (vault (get-vault owner token))
    (prev-owner (get prev-owner (unwrap! vault (err ERR_VAULT_UNKNOWN))))
    (next-owner (get next-owner (unwrap! vault (err ERR_VAULT_UNKNOWN))))
  )
    (asserts! (has-access) (err ERR_NOT_AUTHORIZED))

    ;; Update prev vault
    (if (is-some prev-owner)
      (let (
        (prev-owner-addr (unwrap-panic prev-owner))
      )
        (map-set vaults { owner: prev-owner-addr, token: token } 
          (merge (unwrap-panic (get-vault prev-owner-addr token)) { next-owner: next-owner })
        )
      )

      (map-set tokens { token: token } 
        (merge token-info { first-owner: next-owner 
      }))
    )

    ;; Update next vault
    (if (is-some next-owner)
      (let (
        (next-owner-addr (unwrap-panic next-owner))
      )
        (map-set vaults { owner: next-owner-addr, token: token } 
          (merge (unwrap-panic (get-vault next-owner-addr token)) { prev-owner: prev-owner })
        )
      )

      (map-set tokens { token: token } 
        (merge token-info { last-owner: prev-owner })
      )
    )

    ;; Remove from map
    (map-delete vaults { owner: owner, token: token })

    (if (is-eq (get total-vaults (unwrap-panic (get-token token))) u1)
      ;; Remove last vault
      (map-set tokens { token: token } 
        { total-vaults: u0, first-owner: none, last-owner: none }
      )
      ;; Remove vault
      (map-set tokens { token: token } 
        (merge (unwrap-panic (get-token token)) { total-vaults: (- (get total-vaults token-info) u1) })
      )
    )

    (print { action: "vaults-list-remove", owner: owner, token: token })

    ;; Return token info
    (ok (unwrap-panic (get-token token)))
  )
)
