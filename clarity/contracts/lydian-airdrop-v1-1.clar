

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map claimed
  { user: principal }
  {
    amount: uint
  }
)

(define-read-only (get-claimed (user principal))
  (default-to
    {
      amount: u0
    }
    (map-get? claimed { user: user })
  )
)


;; ---------------------------------------------------------
;; Claim LDN
;; ---------------------------------------------------------

(define-read-only (ldn-for-user (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))
    (diko-supply (unwrap-panic (at-block block-hash (contract-call? .arkadiko-token get-total-supply))))
    (user-diko (unwrap-panic (get-total-diko-for-user user block)))

    (ldn-to-distribute u1538461538)
    (diko-percentage (/ (* user-diko u1000000000000) diko-supply))
    (ldn-user (/ (* diko-percentage ldn-to-distribute) u1000000000000))
  )
    (ok ldn-user)
  )
)

(define-public (claim)
  (let (
    (sender tx-sender)
    (ldn-user (unwrap-panic (ldn-for-user sender u47500)))
    (claimed-amount (get amount (get-claimed sender)))
    (left-to-claim (- ldn-user claimed-amount))
  )
    (if (is-eq left-to-claim u0)
      (ok false)

      (begin
        ;; Update claimed map
        (map-set claimed { user: sender } { amount: (+ claimed-amount left-to-claim) })

        ;; TODO - SET MAINNET ADDRESS FOR LYDIAN TOKEN
        (as-contract (contract-call? .lydian-token transfer left-to-claim (as-contract tx-sender) sender none))
      )
    )
  )
)


;; ---------------------------------------------------------
;; DIKO for user
;; ---------------------------------------------------------

(define-read-only (get-total-diko-for-user (user principal) (block uint))
  (let (
    (wallet-diko (unwrap-panic (get-diko-wallet-for-user user block)))
    (stdiko-diko (unwrap-panic (get-stdiko-wallet-for-user user block)))
    (lp1-diko (unwrap-panic (get-diko-usda-for-user user block)))
    (lp2-diko (unwrap-panic (get-wstx-diko-for-user user block)))
  )
    (ok (+ wallet-diko stdiko-diko lp1-diko lp2-diko))
  )
)

(define-read-only (get-diko-for-user (user principal) (block uint))
  (let (
    (wallet-diko (unwrap-panic (get-diko-wallet-for-user user block)))
    (stdiko-diko (unwrap-panic (get-stdiko-wallet-for-user user block)))
    (lp1-diko (unwrap-panic (get-diko-usda-for-user user block)))
    (lp2-diko (unwrap-panic (get-wstx-diko-for-user user block)))
  )
    (ok {
      diko: wallet-diko,
      stdiko: stdiko-diko,
      dikousda: lp1-diko,
      wstxdiko: lp2-diko
    })
  )
)

(define-read-only (get-diko-wallet-for-user (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    (diko-wallet (unwrap-panic (at-block block-hash (contract-call? .arkadiko-token get-balance user))))
  )
    (ok diko-wallet)
  )
)

(define-read-only (get-stdiko-wallet-for-user (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    (stdiko-wallet (unwrap-panic (at-block block-hash (contract-call? .stdiko-token get-balance user))))
    (stdiko-supply (unwrap-panic (at-block block-hash (contract-call? .stdiko-token get-total-supply))))
    (diko-balance-pool (unwrap-panic (at-block block-hash (contract-call? .arkadiko-token get-balance .arkadiko-stake-pool-diko-v1-2))))
    (stdiko-percentage (/ (* stdiko-wallet u1000000000000) stdiko-supply))
    (diko-from-stdiko (/ (* stdiko-percentage diko-balance-pool) u1000000000000))
  )
    (ok diko-from-stdiko)
  )
)

(define-read-only (get-diko-usda-for-user (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    ;; LP in wallet
    (lp-wallet (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-diko-usda get-balance user))))
    (lp-staked (at-block block-hash (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 get-stake-amount-of user)))
    (lp-total (+ lp-wallet lp-staked))

    ;; Total LP
    (lp-supply (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-diko-usda get-total-supply))))

    ;; DIKO in pool
    (pool-data (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-v2-1 get-pair-details .arkadiko-token .usda-token))))
    (pool-diko (unwrap-panic (get balance-x pool-data)))

    ;; stDIKO from wallet to DIKO
    (lp-percentage (/ (* lp-total u1000000000000) lp-supply))
    (diko (/ (* lp-percentage pool-diko) u1000000000000))
  )
    (ok diko)
  )
)

(define-read-only (get-wstx-diko-for-user (user principal) (block uint))
  (let (
    (block-hash (unwrap-panic (get-block-info? id-header-hash block)))

    ;; LP in wallet
    (lp-wallet (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-wstx-diko get-balance user))))
    (lp-staked (at-block block-hash (contract-call? .arkadiko-stake-pool-wstx-diko-v1-1 get-stake-amount-of user)))
    (lp-total (+ lp-wallet lp-staked))

    ;; Total LP
    (lp-supply (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-token-wstx-diko get-total-supply))))

    ;; DIKO in pool
    (pool-data (unwrap-panic (at-block block-hash (contract-call? .arkadiko-swap-v2-1 get-pair-details .wrapped-stx-token .arkadiko-token))))
    (pool-diko (unwrap-panic (get balance-y pool-data)))

    ;; stDIKO from wallet to DIKO
    (lp-percentage (/ (* lp-total u1000000000000) lp-supply))
    (diko (/ (* lp-percentage pool-diko) u1000000000000))
  )
    (ok diko)
  )
)
