(impl-trait .arkadiko-liquidation-rewards-trait-v2.liquidation-rewards-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait liquidation-pool-trait .arkadiko-liquidation-pool-trait-v1.liquidation-pool-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED u30401)
(define-constant ERR-WRONG-TOKEN u30002)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u30003)
(define-constant ERR-TOKEN-NOT-WHITELISTED u30004)
(define-constant ERR-REWARD-LOCKED u30005)

;; Variables
(define-data-var total-reward-ids uint u0)
(define-data-var shutdown-activated bool false)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map reward-data
  { 
    reward-id: uint,
  } 
  {
    share-block: uint, ;; STX block on which USDA shares are calculated
    unlock-block: uint, ;; BTC block on which stacking tokens unlock
    token-is-stx: bool,
    token: principal,
    total-amount: uint
  }
)

(define-map reward-claimed
  { 
    reward-id: uint,
    user: principal
  } 
  {
    claimed: bool
  }
)

(define-map reward-tokens
  { 
    token: principal,
  } 
  {
    whitelisted: bool
  }
)

(define-read-only (get-total-reward-ids)
  (var-get total-reward-ids)
)

;; @desc get data for given reward
;; @param reward-id; the reward
(define-read-only (get-reward-data (reward-id uint))
  (default-to
    { share-block: u0, unlock-block: u0, token-is-stx: false, token: .usda-token, total-amount: u0 }
    (map-get? reward-data { reward-id : reward-id  })
  )
)

;; @desc get amount a user has already claimed for given reward
;; @param reward-id; the reward
;; @param user; the user who claimed
(define-read-only (get-reward-claimed (reward-id uint) (user principal))
  (default-to
    { claimed: false }
    (map-get? reward-claimed { reward-id : reward-id, user: user })
  )
)

;; @desc get reward data combined with user info
;; @param reward-id; the reward
(define-public (get-user-reward-info (reward-id uint) (user principal) (liquidation-pool <liquidation-pool-trait>))
  (let (
    (sender-rewards (unwrap-panic (get-rewards-of user reward-id liquidation-pool)))
    (rewards-data (get-reward-data reward-id))
  )
    (ok {
      reward-id: reward-id,
      pending-rewards: sender-rewards,
      unlock-block: (get unlock-block rewards-data),
      token: (get token rewards-data),
      token-is-stx: (get token-is-stx rewards-data)
    })
  )
)

(define-read-only (token-whitelisted (token principal))
  (get whitelisted (default-to
    { whitelisted: false }
    (map-get? reward-tokens { token: token  })
  ))
)

(define-read-only (get-shutdown-activated)
  (or
    (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated))
    (var-get shutdown-activated)
  )
)

;; ---------------------------------------------------------
;; Add rewards
;; ---------------------------------------------------------

(define-public (add-reward (share-block uint) (token-is-stx bool) (token <ft-trait>) (total-amount uint))
  (add-reward-locked share-block u0 token-is-stx token total-amount)
)

(define-public (add-reward-locked (share-block uint) (unlock-block uint) (token-is-stx bool) (token <ft-trait>) (total-amount uint))
  (let (
    (reward-id (var-get total-reward-ids))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (or token-is-stx (token-whitelisted (contract-of token))) (err ERR-TOKEN-NOT-WHITELISTED))

    ;; Transfer rewards to contract
    (if token-is-stx
      (try! (stx-transfer? total-amount tx-sender (as-contract tx-sender)))
      (try! (contract-call? token transfer total-amount tx-sender (as-contract tx-sender) none))
    )

    ;; Add reward to map
    (map-set reward-data  { reward-id: reward-id } { 
      share-block: share-block,
      unlock-block: unlock-block,
      token-is-stx: token-is-stx,
      token: (contract-of token),
      total-amount: total-amount
    })

    ;; Update total-reward-ids
    (var-set total-reward-ids (+ reward-id u1))

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Get rewards
;; ---------------------------------------------------------

;; @desc get amount of rewards for user
;; @param user; user to get rewards for
;; @param reward-id; the rewards
(define-public (get-rewards-of (user principal) (reward-id uint) (liquidation-pool <liquidation-pool-trait>))
  (let (
    (reward-info (get-reward-data reward-id))
    (share-block (get share-block reward-info))
    (total-amount (get total-amount reward-info))

    (user-shares (unwrap-panic (contract-call? liquidation-pool get-shares-at user share-block)))
    (total-rewards (/ (* user-shares total-amount) u10000000))

    (claimed (get claimed (get-reward-claimed reward-id user)))
  )
    (asserts! (is-eq (contract-of liquidation-pool) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "liquidation-pool"))) (ok u0))

    (if claimed 
      (ok u0)
      (ok total-rewards)
    )
  )
)

;; @desc claim rewards for user
;; @param reward-id; the rewards
;; @param token; the reward token
;; @param liquidation-pool; the pool on which shares are based
(define-public (claim-rewards-of (reward-id uint) (token <ft-trait>) (liquidation-pool <liquidation-pool-trait>))
  (let (
    (user tx-sender)
    (reward-amount (unwrap-panic (get-rewards-of user reward-id liquidation-pool)))
    (reward-info (get-reward-data reward-id))
  )
    (asserts! (not (get-shutdown-activated)) (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED))
    (asserts! (is-eq (contract-of token) (get token reward-info)) (err ERR-WRONG-TOKEN))
    (asserts! (> burn-block-height (get unlock-block reward-info)) (err ERR-REWARD-LOCKED))

    (if (is-eq reward-amount u0)
      (ok u0)
      (begin 
        (if (get token-is-stx reward-info)
          (try! (as-contract (stx-transfer? reward-amount (as-contract tx-sender) user)))
          (try! (as-contract (contract-call? token transfer reward-amount (as-contract tx-sender) user none)))
        )

        (map-set reward-claimed  { reward-id: reward-id, user: user } { claimed: true })

        (ok reward-amount)
      )
    )
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (update-reward-tokens (token principal) (whitelisted bool))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (map-set reward-tokens  { token: token } { whitelisted: whitelisted })
    
    (ok true)
  )
)

(define-public (toggle-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set shutdown-activated (not (var-get shutdown-activated))))
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  (map-set reward-tokens  { token: .arkadiko-token } { whitelisted: true })
  (map-set reward-tokens  { token: .xstx-token } { whitelisted: true })

  ;; TODO - UPDATE ADDRESS FOR MAINNET
  (map-set reward-tokens  { token: .Wrapped-Bitcoin } { whitelisted: true })
)