;; @contract DIKO Stake Pool
;; @version 2.0

;; TODO: update stake-registry so this pool can get DIKO rewards

;; Traits
(impl-trait .usda-pool-trait-v1-1.usda-pool-trait)
(use-trait stake-registry-trait .arkadiko-stake-registry-trait-v1.stake-registry-trait)
;; TODO: update address
(use-trait ft-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)

;; Errors
(define-constant ERR-REWARDS-CALC (err u110002))
(define-constant ERR-INSUFFICIENT-STAKE (err u110003))
(define-constant ERR-WRONG-REGISTRY (err u110004))
(define-constant ERR-NOT-MANAGER (err u110005))

;; Variables
(define-data-var total-staked uint u0) ;; DIKO, esDIKO & MultiplierPoints
(define-data-var last-reward-increase-block uint u0) 

;; TODO: need this for DIKO & USDA rewards
(define-data-var cumm-reward-per-stake uint u0)

;; Track ammount and cummulative reward for staker
(define-map stakes 
  { staker: principal } 
  {
    amount: uint, ;; TODO: split for DIKO & esDIKO
    cumm-reward-per-stake: uint
  }
)

;; ---------------------------------------------------------
;; Getters
;; ---------------------------------------------------------

;; @desc get staker info
(define-read-only (get-stake-of (staker principal))
  (default-to
    { amount: u0, cumm-reward-per-stake: u0 }
    (map-get? stakes { staker: staker })
  )
)

;; @desc get variable total-staked
(define-read-only (get-total-staked)
  (var-get total-staked)
)

;; @desc get variable cumm-reward-per-stake
(define-read-only (get-cumm-reward-per-stake)
  (var-get cumm-reward-per-stake)
)

;; @desc get variable last-reward-increase-block
(define-read-only (get-last-reward-increase-block)
  (var-get last-reward-increase-block)
)

;; ---------------------------------------------------------
;; Stake & Unstake
;; ---------------------------------------------------------

;; @desc stake tokens in the pool
;; @param registry-trait; used to get reward per block
;; @param token; token to stake
;; @param amount; amount to stake
;; @post uint; returns amount of tokens staked
(define-public (stake (registry-trait <stake-registry-trait>) (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
    (current-stake-amount (get amount (get-stake-of staker)))
  )
    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    (try! (claim-pending-rewards registry-trait))
    ;; TODO: check if token = DIKO or esDIKO

    ;; Update total stake and increase cummulative rewards
    (var-set total-staked (+ (var-get total-staked) amount))
    (unwrap-panic (increase-cumm-reward-per-stake registry-trait))

    ;; Transfer tokens and update map
    (try! (contract-call? token transfer amount staker (as-contract tx-sender) none))
    (map-set stakes { staker: staker } { amount: (+ current-stake-amount amount), cumm-reward-per-stake: (var-get cumm-reward-per-stake) })

    (ok amount)
  )
)

;; @desc unstake tokens in the pool
;; @param registry-trait; used to get reward per block
;; @param token; token to unstake
;; @param amount; amount to unstake
;; @post uint; returns amount of tokens unstaked
(define-public (unstake (registry-trait <stake-registry-trait>) (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
    (current-stake-amount (get amount (get-stake-of staker)))
  )
    (asserts! (>= current-stake-amount amount) ERR-INSUFFICIENT-STAKE)
    ;; TODO: check if token = DIKO or esDIKO

    ;; This method will increase the cumm-rewards-per-stake, and set it for the staker
    (try! (claim-pending-rewards registry-trait))

    ;; Update total stake and increase cummulative rewards
    (var-set total-staked (- (var-get total-staked) amount))
    (unwrap-panic (increase-cumm-reward-per-stake registry-trait))

    ;; Transfer tokens and update map
    (try! (as-contract (contract-call? token transfer amount tx-sender staker none)))
    (map-set stakes { staker: staker } { amount: (- current-stake-amount amount), cumm-reward-per-stake: (var-get cumm-reward-per-stake) })

    (ok amount)
  )
)

;; @desc unstake tokens without claiming rewards
;; @param registry-trait; used to get reward per block
;; @param token; token to unstake
;; @param amount; amount to unstake
;; @post uint; returns unstaked amount
(define-public (emergency-unstake (registry-trait <stake-registry-trait>) (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
    (current-stake-amount (get amount (get-stake-of staker)))
  )
    ;; Update total stake and increase cummulative rewards
    (var-set total-staked (- (var-get total-staked) amount))
    (unwrap-panic (increase-cumm-reward-per-stake registry-trait))

    ;; Transfer tokens and update map
    (try! (as-contract (contract-call? token transfer amount tx-sender staker none)))
    (map-set stakes { staker: staker } { amount: (- current-stake-amount amount), cumm-reward-per-stake: (var-get cumm-reward-per-stake) })

    (ok amount)
  )
)

;; ---------------------------------------------------------
;; User rewards
;; ---------------------------------------------------------

;; @desc get amount of pending rewards for staker
;; @param registry-trait; used to get reward per block
;; @param staker; staker to get pending rewards for
;; @post uint; returns pending rewards
(define-public (get-pending-rewards (registry-trait <stake-registry-trait>) (staker principal))
  (let (
    (stake-amount (get amount (get-stake-of staker)))
    (current-cumm-reward (unwrap-panic (calculate-cumm-reward-per-stake registry-trait)))
    (user-cumm-reward (get cumm-reward-per-stake (get-stake-of staker)))
    (amount-owed-per-token (- current-cumm-reward user-cumm-reward))
    (rewards-decimals (* stake-amount amount-owed-per-token))
    (rewards (/ rewards-decimals u1000000))
  )
    (ok rewards)
  )
)

;; @desc claim pending rewards
;; @param registry-trait; used to get reward per block
;; @post uint; returns claimed rewards
(define-public (claim-pending-rewards (registry-trait <stake-registry-trait>))
  (let (
    (staker tx-sender)
    (increase-result (unwrap-panic (increase-cumm-reward-per-stake registry-trait)))
    (pending-rewards (unwrap! (get-pending-rewards registry-trait staker) ERR-REWARDS-CALC))
    (stake-of (get-stake-of staker))
  )
    (asserts! (>= pending-rewards u1) (ok u0))

    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token pending-rewards staker))
    (map-set stakes { staker: staker } (merge stake-of { cumm-reward-per-stake: (var-get cumm-reward-per-stake) }))
    (ok pending-rewards)
  )
)

;; ---------------------------------------------------------
;; Cummulative rewards
;; ---------------------------------------------------------

;; @desc increase cummulative rewards per stake
;; @param registry-trait; used to get reward per block
;; @post uint; new cummulative rewards per stake
(define-public (increase-cumm-reward-per-stake (registry-trait <stake-registry-trait>))
  (let (
    (new-cumm-reward-per-stake (unwrap-panic (calculate-cumm-reward-per-stake registry-trait)))
  )
    (var-set cumm-reward-per-stake new-cumm-reward-per-stake)
    (var-set last-reward-increase-block block-height)
    (ok new-cumm-reward-per-stake)
  )
)

;; @desc get the cumm rewards per stake for current block height
;; @param registry-trait; used to get reward per block
;; @post uint; the cummulative rewards per stake
(define-public (calculate-cumm-reward-per-stake (registry-trait <stake-registry-trait>))
  (let (
    (current-total-staked (var-get total-staked))
    (current-cumm-reward-per-stake (var-get cumm-reward-per-stake)) 
    (rewards-per-block (unwrap-panic (contract-call? registry-trait get-rewards-per-block-for-pool (as-contract tx-sender))))
  )
    (asserts! (is-eq (contract-of registry-trait) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-registry"))) ERR-WRONG-REGISTRY)
    (asserts! (> block-height (var-get last-reward-increase-block)) (ok current-cumm-reward-per-stake))
    (asserts! (> current-total-staked u0) (ok current-cumm-reward-per-stake))

    (let (
      (block-diff (- block-height (var-get last-reward-increase-block)))
      (total-rewards-to-distribute (* rewards-per-block block-diff))
      (reward-added-per-token (/ (* total-rewards-to-distribute u1000000) current-total-staked))
      (new-cumm-reward-per-stake (+ current-cumm-reward-per-stake reward-added-per-token))
    )
      (ok new-cumm-reward-per-stake)
    )
  )
)
