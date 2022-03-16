(define-constant ERR-NOT-AUTHORIZED u444001)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u444002)

(define-constant ldn-for-stdiko u591010441)
(define-constant ldn-for-diko-usda u520508667)
(define-constant ldn-for-wstx-diko u426980892)

;; ---------------------------------------------------------
;; Emergency
;; ---------------------------------------------------------

(define-data-var shutdown-activated bool false)

(define-public (toggle-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set shutdown-activated (not (var-get shutdown-activated))))
  )
)

(define-read-only (get-shutdown-activated)
  (or
    (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated))
    (var-get shutdown-activated)
  )
)

(define-public (emergency-withdraw-tokens)
  (let (
    (guardian tx-sender)
    (contract-balance (unwrap-panic (contract-call? 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.wrapped-lydian-token get-balance (as-contract tx-sender))))
  )
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))
    (as-contract (contract-call? 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.wrapped-lydian-token transfer contract-balance (as-contract tx-sender) guardian none))
  )
)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map claimed
  { user: principal }
  {
    amount-stdiko: uint,
    amount-wstx-diko: uint,
    amount-diko-usda: uint,
  }
)

(define-read-only (get-claimed (user principal))
  (default-to
    {
      amount-stdiko: u0,
      amount-wstx-diko: u0,
      amount-diko-usda: u0,
    }
    (map-get? claimed { user: user })
  )
)

;; ---------------------------------------------------------
;; stDIKO pool
;; ---------------------------------------------------------

(define-public (claim-ldn-for-stdiko-pool)
  (let (
    (sender tx-sender)
    (ldn-user (unwrap-panic (get-ldn-for-stdiko-pool sender u47500)))
    (claimed-map (get-claimed sender))
    (claimed-amount (get amount-stdiko claimed-map))
    (left-to-claim (- ldn-user claimed-amount))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))

    (if (is-eq left-to-claim u0)
      (ok false)

      (begin
        ;; Update claimed map
        (map-set claimed { user: sender } (merge claimed-map { amount-stdiko: (+ claimed-amount left-to-claim) }))
        (as-contract (contract-call? 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.wrapped-lydian-token transfer left-to-claim (as-contract tx-sender) sender none))
      )
    )
  )
)

(define-read-only (get-ldn-for-stdiko-pool (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    (stdiko-wallet (unwrap-panic (at-block block-hash (contract-call? .stdiko-token get-balance user))))
    (stdiko-supply (unwrap-panic (at-block block-hash (contract-call? .stdiko-token get-total-supply))))

    ;; Pool percentage
    (pool-percentage (/ (* stdiko-wallet u1000000000000) stdiko-supply))
    (ldn-to-receive (/ (* pool-percentage ldn-for-stdiko) u1000000000000))
  )
    (ok ldn-to-receive)
  )
)

;; ---------------------------------------------------------
;; DIKO/USDA pool
;; ---------------------------------------------------------

(define-public (claim-ldn-for-diko-usda-pool)
  (let (
    (sender tx-sender)
    (ldn-user (unwrap-panic (get-ldn-for-diko-usda-pool sender u47500)))
    (claimed-map (get-claimed sender))
    (claimed-amount (get amount-diko-usda claimed-map))
    (left-to-claim (- ldn-user claimed-amount))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))

    (if (is-eq left-to-claim u0)
      (ok false)

      (begin
        ;; Update claimed map
        (map-set claimed { user: sender } (merge claimed-map { amount-diko-usda: (+ claimed-amount left-to-claim) }))
        (as-contract (contract-call? 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.wrapped-lydian-token transfer left-to-claim (as-contract tx-sender) sender none))
      )
    )
  )
)

(define-read-only (get-ldn-for-diko-usda-pool (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    ;; LP in wallet
    (lp-wallet (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-diko-usda get-balance user))))
    (lp-staked (at-block block-hash (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 get-stake-amount-of user)))
    (lp-total (+ lp-wallet lp-staked))

    ;; Total LP
    (lp-supply (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-diko-usda get-total-supply))))

    ;; LP percentage
    (lp-percentage (/ (* lp-total u1000000000000) lp-supply))
    (ldn-to-receive (/ (* lp-percentage ldn-for-diko-usda) u1000000000000))
  )
    (ok ldn-to-receive)
  )
)


;; ---------------------------------------------------------
;; STX/DIKO pool
;; ---------------------------------------------------------

(define-public (claim-ldn-for-wstx-diko-pool)
  (let (
    (sender tx-sender)
    (ldn-user (unwrap-panic (get-ldn-for-wstx-diko-pool sender u47500)))
    (claimed-map (get-claimed sender))
    (claimed-amount (get amount-wstx-diko claimed-map))
    (left-to-claim (- ldn-user claimed-amount))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))

    (if (is-eq left-to-claim u0)
      (ok false)

      (begin
        ;; Update claimed map
        (map-set claimed { user: sender } (merge claimed-map { amount-wstx-diko: (+ claimed-amount left-to-claim) }))
        (as-contract (contract-call? 'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.wrapped-lydian-token transfer left-to-claim (as-contract tx-sender) sender none))
      )
    )
  )
)

(define-read-only (get-ldn-for-wstx-diko-pool (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    ;; LP in wallet
    (lp-wallet (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-wstx-diko get-balance user))))
    (lp-staked (at-block block-hash (contract-call? .arkadiko-stake-pool-wstx-diko-v1-1 get-stake-amount-of user)))
    (lp-total (+ lp-wallet lp-staked))

    ;; Total LP
    (lp-supply (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-wstx-diko get-total-supply))))

    ;; LP percentage
    (lp-percentage (/ (* lp-total u1000000000000) lp-supply))
    (ldn-to-receive (/ (* lp-percentage ldn-for-wstx-diko) u1000000000000))
  )
    (ok ldn-to-receive)
  )
)
