;; DIKO Guardian - Protecting DIKO distribution
;; 
;; Staking rewards, team tokens etc.
;; 

(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)

;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u22401))

;; Constants
(define-constant MIN-STAKING-BLOCK-REWARDS u28000000) ;; 28 DIKO
(define-constant BLOCKS-PER-MONTH u4320) ;; 144 * 30
(define-constant FOUNDERS-TOKENS-PER-MONTH u437500000000) ;; 437.500
(define-constant STAKING-REWARDS-FIRST-YEAR u25000000000000) ;; 25m with 6 decimals
(define-constant REWARDS-PER-BLOCK-START u320000000) ;; 

;; Variables
(define-data-var contract-start-block uint block-height)
(define-data-var founders-wallet principal tx-sender)
(define-data-var founders-tokens-claimed uint u0) 

;; ---------------------------------------------------------
;; Staking
;; ---------------------------------------------------------

;; Get currrent staking rewards per block for all pools
;; The yearly rewards are reduced by half every year
;; During the year, the rewards are reduced every 2 weeks
(define-read-only (get-staking-rewards-per-block)
  (let (
    ;; 26 steps per year (2 week interval)
    (steps-per-year u26)
    ;; 144 blocks per day, 14 days
    (blocks-per-step u2016) 

    ;; each step is equal to 2 weeks. This calculates the current step we are in, since the start
    (step-number (/ (- block-height (var-get contract-start-block)) blocks-per-step))

    ;; year we are currently in since start
    (year-number (+ (/ step-number steps-per-year) u1))
    ;; step number in the curent year (instead of since start)
    (step-number-current-year (mod step-number steps-per-year))
    ;; rewards are halved every year because of this devider (1, 2, 4, 8, 16)
    (staking-rewards-divider (pow u2 (- year-number u1)))
    ;; the total rewards to distribute in the current year
    (year-rewards (/ STAKING-REWARDS-FIRST-YEAR staking-rewards-divider))
    ;; avg rewards per step (2 weeks)
    (avg-rewards-per-step (/ year-rewards steps-per-year))

    ;; max-percentage = 1.33333, min-percentage = 0.666666
    ;; used to linearly decrease rewards per step in a given year
    (max-percentage (+ u10000000000 (/ u10000000000 u3)))
    (min-percentage (- u10000000000 (/ u10000000000 u3)))
    (step-percentage-diff (/ (- max-percentage min-percentage) steps-per-year))

    ;; based on the avg rewards per step, and the percentages
    (actual-step-rewards (* avg-rewards-per-step (- max-percentage (* step-number-current-year step-percentage-diff))))
    ;; block rewarrds based on step rewards
    (actual-block-rewards (/ (/ actual-step-rewards blocks-per-step) u10000000000))

    ;; Extra multiplier of 98.5% - makes sure we remain below our targets
    (block-rewards (/ (* actual-block-rewards u9850000000) u10000000000))
  )
    ;; Min 28 DIKO 
    (if (>= block-rewards MIN-STAKING-BLOCK-REWARDS)
      block-rewards
      MIN-STAKING-BLOCK-REWARDS
    )
  )
)


;; ---------------------------------------------------------
;; Vaults
;; ---------------------------------------------------------

;; Get currrent vault rewards per block for all vaults
;; Rewards only apply in the first year, during which they are reduced every 2 weeks
(define-read-only (get-vault-rewards-per-block)
  (let (

    ;; 144 blocks per day, 7 days
    (blocks-per-step u1008) 
    
    ;; each step is equal to 1 week. This calculates the current step we are in, since the start
    (step-number (/ (- block-height (var-get contract-start-block)) blocks-per-step))

    ;; Every step, the divider is increased by 10%
    (staking-rewards-divider (/ (* (pow u11 step-number) u100) (pow u10 step-number)))

    (block-rewards (* (/ REWARDS-PER-BLOCK-START staking-rewards-divider) u100))
  )
    ;; Rewards only for first 6 weeks (step-number starts at 0)
    (if (<= step-number u5)
      block-rewards
      u0
    )
  )
)

;; ---------------------------------------------------------
;; Founders
;; ---------------------------------------------------------

;; Set founders wallet to new address
(define-public (set-founders-wallet (address principal))
  (let (
    (wallet (var-get founders-wallet))
  )
    (asserts! (is-eq wallet tx-sender) ERR-NOT-AUTHORIZED)
    (var-set founders-wallet address)
    (ok true)
  )
)

;; Get number of founders tokens claimed already
(define-read-only (get-claimed-founders-tokens)
  (var-get founders-tokens-claimed)
)

;; Get amount of tokens founders can claim
;; The founders are vested on 4 years, with a 6 months cliff.
;; Vesting happens monthly. 21m / 48 months = 437.500 per month
(define-read-only (get-pending-founders-tokens)
  (let (
    ;; Current month number after start
    (month-number (/ (- block-height (var-get contract-start-block)) BLOCKS-PER-MONTH))
  )
    ;; Vesting period
    (if (and (>= month-number u6) (<= month-number u47))
      (let (
        (max-tokens (* month-number FOUNDERS-TOKENS-PER-MONTH))
        (claimed-tokens (var-get founders-tokens-claimed))
      )
        (ok (- max-tokens claimed-tokens)) 
      )
      ;; Vesting ended
      (if (> month-number u47)
        (let (
          (max-tokens (* u48 FOUNDERS-TOKENS-PER-MONTH))
          (claimed-tokens (var-get founders-tokens-claimed))
        )
          (ok (- max-tokens claimed-tokens)) 
        )
        ;; Vesting did not start yet
        (ok u0)
      )
    )
  )
)

;; Claim tokens for team
(define-public (founders-claim-tokens (amount uint))
  (let (
    (pending-tokens (unwrap! (get-pending-founders-tokens) ERR-NOT-AUTHORIZED))
    (claimed-tokens (var-get founders-tokens-claimed))
    (wallet (var-get founders-wallet))
  )
    (asserts! (is-eq wallet tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (>= pending-tokens amount) ERR-NOT-AUTHORIZED)
    (var-set founders-tokens-claimed (+ claimed-tokens amount))
    (contract-call? .dao mint-token .arkadiko-token amount wallet)
  )
)
