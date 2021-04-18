(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)

;; Arkadiko DAO
;; 1. See all proposals
;; 2. Vote on a proposal
;; 3. Submit new proposal (hold token supply >= 1%)
;; 4. Initiate Stacking

;; errors
(define-constant ERR-NOT-ENOUGH-BALANCE u31)
(define-constant ERR-TRANSFER-FAILED u32)
(define-constant ERR-NOT-AUTHORIZED u3401)
(define-constant STATUS-OK u3200)

(define-private (get-dao-owner)
  (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0xd2454d24b49126f7f47c986b06960d7f5b70812359084197a200d691e67a002e)
    'ST2YP83431YWD9FNWTTDCQX8B3K0NDKPCV3B1R30H ;; Testnet only
    (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0x6b2c809627f2fd19991d8eb6ae034cb4cce1e1fc714aa77351506b5af1f8248e)
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 ;; Mainnet (TODO)
      'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7 ;; Other test environments
    )
  )
)

;; proposal variables
(define-map proposals
  { id: uint }
  {
    id: uint,
    proposer: principal,
    is-open: bool,
    start-block-height: uint,
    end-block-height: uint,
    yes-votes: uint,
    no-votes: uint,
    token: (string-ascii 12),
    collateral-type: (string-ascii 12),
    type: (string-ascii 200),
    changes: (list 10 (tuple (key (string-ascii 256)) (new-value uint))),
    details: (string-ascii 256)
  }
)
(define-data-var proposal-count uint u0)
(define-data-var proposal-ids (list 220 uint) (list u0))
(define-map votes-by-member { proposal-id: uint, member: principal } { vote-count: uint })
(define-data-var emergency-shutdown-activated bool false)
(define-data-var stacker-yield uint u9000) ;; 90%
(define-data-var governance-token-yield uint u500) ;; 5%
(define-data-var governance-reserve-yield uint u500) ;; 5%
(define-data-var maximum-debt-surplus uint u10000000000000) ;; 10 million default

(define-read-only (get-votes-by-member-by-id (proposal-id uint) (member principal))
  (default-to 
    { vote-count: u0 }
    (map-get? votes-by-member { proposal-id: proposal-id, member: member })))

(define-read-only (get-proposal-by-id (proposal-id uint))
  (default-to
    {
      id: u0,
      proposer: 'ST21HMSJATHZ888PD0S0SSTWP4J61TCRJYEVQ0STB, ;; TODO: should we hardcode a testnet address here?
      is-open: false,
      start-block-height: u0,
      end-block-height: u0,
      yes-votes: u0,
      no-votes: u0,
      token: "",
      collateral-type: "",
      type: "",
      changes: (list { key: "", new-value: u0 } ),
      details: (unwrap-panic (as-max-len? "" u256))
    }
    (map-get? proposals { id: proposal-id })))

(define-read-only (get-proposals)
  (ok (map get-proposal-by-id (var-get proposal-ids)))
)

(define-read-only (get-proposal-ids)
  (ok (var-get proposal-ids))
)

(define-read-only (get-collateral-type-by-token (token (string-ascii 12)))
  (unwrap!
    (map-get? collateral-types { token: token })
    (tuple
      (name "")
      (token "")
      (token-type "")
      (url "")
      (total-debt u0)
      (liquidation-ratio u0)
      (collateral-to-debt-ratio u0)
      (maximum-debt u0)
      (liquidation-penalty u0)
      (stability-fee u0)
      (stability-fee-apy u0)
    )
  )
)

(define-map collateral-types
  { token: (string-ascii 12) }
  {
    name: (string-ascii 256),
    token: (string-ascii 12),
    token-type: (string-ascii 12),
    url: (string-ascii 256),
    total-debt: uint,
    liquidation-ratio: uint,
    collateral-to-debt-ratio: uint,
    maximum-debt: uint,
    liquidation-penalty: uint,
    stability-fee: uint,
    stability-fee-apy: uint
  }
)

(define-map proposal-types
  { type: (string-ascii 200) }
  {
    changes-keys: (list 10 (string-ascii 256))
  }
)

(define-read-only (get-liquidation-ratio (token (string-ascii 12)))
  (ok (get liquidation-ratio (get-collateral-type-by-token token)))
)

(define-read-only (get-collateral-to-debt-ratio (token (string-ascii 12)))
  (ok (get collateral-to-debt-ratio (get-collateral-type-by-token token)))
)

(define-read-only (get-maximum-debt (token (string-ascii 12)))
  (ok (get maximum-debt (get-collateral-type-by-token token)))
)

(define-read-only (get-total-debt (token (string-ascii 12)))
  (ok (get total-debt (get-collateral-type-by-token token)))
)

(define-read-only (get-liquidation-penalty (token (string-ascii 12)))
  (ok (get liquidation-penalty (get-collateral-type-by-token token)))
)

(define-read-only (get-stability-fee (token (string-ascii 12)))
  (ok (get stability-fee (get-collateral-type-by-token token)))
)

(define-read-only (get-stability-fee-apy (token (string-ascii 12)))
  (ok (get stability-fee-apy (get-collateral-type-by-token token)))
)

(define-read-only (get-stacker-yield)
  (ok (var-get stacker-yield)) ;; stacker gets 80% of the yield
)

(define-read-only (get-governance-token-yield)
  (ok (var-get governance-token-yield)) ;; token holders get 10% of the yield
)

(define-read-only (get-governance-reserve-yield)
  (ok (var-get governance-reserve-yield)) ;; reserve gets 10% of the yield
)

(define-read-only (get-emergency-shutdown-activated)
  (ok (var-get emergency-shutdown-activated))
)

(define-read-only (get-maximum-debt-surplus)
  (ok (var-get maximum-debt-surplus))
)

;; setters accessible only by DAO contract
(define-public (add-collateral-type (name (string-ascii 12))
                                    (token (string-ascii 12))
                                    (url (string-ascii 256))
                                    (collateral-type (string-ascii 12))
                                    (liquidation-ratio uint)
                                    (liquidation-penalty uint)
                                    (stability-fee uint)
                                    (stability-fee-apy uint)
                                    (maximum-debt uint))
  (begin
    ;; DAO should be calling this method
    (asserts! (is-eq (get-dao-owner) tx-sender) (err ERR-NOT-AUTHORIZED))
    (map-set collateral-types
      { token: collateral-type }
      {
        name: name,
        token: token,
        token-type: collateral-type,
        url: url,
        total-debt: u0,
        liquidation-ratio: liquidation-ratio,
        collateral-to-debt-ratio: u200,
        maximum-debt: maximum-debt,
        liquidation-penalty: liquidation-penalty,
        stability-fee: stability-fee,
        stability-fee-apy: stability-fee-apy
      }
    )
    (ok true)
  )
)

(define-public (add-debt-to-collateral-type (token (string-ascii 12)) (debt uint))
  (begin
    ;; freddie should be calling this method
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { total-debt: (+ debt (get total-debt collateral-type)) }))
      (ok debt)
    )
  )
)

(define-public (subtract-debt-from-collateral-type (token (string-ascii 12)) (debt uint))
  (begin
    ;; freddie should be calling this method
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { total-debt: (- (get total-debt collateral-type) debt) }))
      (ok debt)
    )
  )
)

(define-public (set-liquidation-ratio (token (string-ascii 12)) (ratio uint))
  (begin
    ;; DAO should be calling this method
    (asserts! (is-eq (get-dao-owner) tx-sender) (err ERR-NOT-AUTHORIZED))
    ;; Update liquidation-ratio
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { liquidation-ratio: ratio }))
      (ok (get-liquidation-ratio token)))
  )
)

(define-public (set-collateral-to-debt-ratio (token (string-ascii 12)) (ratio uint))
  (begin
    ;; DAO should be calling this method
    (asserts! (is-eq (get-dao-owner) tx-sender) (err ERR-NOT-AUTHORIZED))
    ;; Update collateral-to-debt-ratio
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { collateral-to-debt-ratio: ratio }))
      (ok (get-liquidation-ratio token)))
  )
)

(define-public (set-maximum-debt (token (string-ascii 12)) (debt uint))
  (begin
    ;; DAO should be calling this method
    (asserts! (is-eq (get-dao-owner) tx-sender) (err ERR-NOT-AUTHORIZED))
    ;; Update maximum-debt
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { maximum-debt: debt }))
      (ok (get-liquidation-ratio token)))
  )
)

(define-public (set-liquidation-penalty (token (string-ascii 12)) (penalty uint))
  (begin
    ;; DAO should be calling this method
    (asserts! (is-eq (get-dao-owner) tx-sender) (err ERR-NOT-AUTHORIZED))
    ;; Update liquidation-penalty
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { liquidation-penalty: penalty }))
      (ok (get-liquidation-ratio token)))
  )
)

(define-public (set-stability-fee (token (string-ascii 12)) (fee uint) (fee-apy uint))
  (begin
    ;; DAO should be calling this method
    (asserts! (is-eq (get-dao-owner) tx-sender) (err ERR-NOT-AUTHORIZED))
    ;; Update stability-fee and stability-fee-apy
    (let ((collateral-type (get-collateral-type-by-token token)))
      (map-set collateral-types
        { token: token }
        (merge collateral-type { stability-fee: fee, stability-fee-apy: fee-apy }))
      (ok (get-liquidation-ratio token)))
  )
)

;; Start a proposal
;; Requires 1% of the supply in your wallet
;; Default voting period is 10 days (144 * 10 blocks)
;; 
(define-public (propose
    (start-block-height uint)
    (details (string-ascii 256))
    (type (string-ascii 200))
    (changes (list 10 (tuple (key (string-ascii 256)) (new-value uint))))
    (token (string-ascii 12))
    (collateral-type (string-ascii 12))
  )
  (let 
    ((proposer-balance (unwrap-panic (contract-call? .arkadiko-token get-balance-of tx-sender)))
    (supply (unwrap-panic (contract-call? .arkadiko-token get-total-supply)))
    (proposal-id (+ u1 (var-get proposal-count))))
    ;; Requires 1% of the supply 
    (asserts! (>= (* proposer-balance u100) supply) (err ERR-NOT-ENOUGH-BALANCE))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      {
        id: proposal-id,
        proposer: tx-sender,
        is-open: true,
        start-block-height: start-block-height,
        end-block-height: (+ start-block-height u1440),
        yes-votes: u0,
        no-votes: u0,
        token: token,
        collateral-type: collateral-type,
        type: type,
        changes: changes,
        details: details
      }
    )
    (var-set proposal-count proposal-id)
    (var-set proposal-ids (unwrap-panic (as-max-len? (append (var-get proposal-ids) proposal-id) u220)))
    (ok true)
  )
)

(define-public (vote-for (proposal-id uint) (amount uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (vote-count (get vote-count (get-votes-by-member-by-id proposal-id tx-sender))))
    ;; Proposal should be open for voting
    (asserts! (is-eq (get is-open proposal) true) (err ERR-NOT-AUTHORIZED))
    ;; Vote should be casted after the start-block-height
    (asserts! (>= block-height (get start-block-height proposal)) (err ERR-NOT-AUTHORIZED))
    ;; Voter should be able to stake
    (try! (contract-call? .arkadiko-token transfer amount tx-sender (as-contract tx-sender)))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      (merge proposal { yes-votes: (+ amount (get yes-votes proposal)) }))
    (map-set votes-by-member 
      { proposal-id: proposal-id, member: tx-sender }
      { vote-count: (+ vote-count amount) })
    (ok STATUS-OK)
  )
)

(define-public (vote-against (proposal-id uint) (amount uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (vote-count (get vote-count (get-votes-by-member-by-id proposal-id tx-sender))))
    ;; Proposal should be open for voting
    (asserts! (is-eq (get is-open proposal) true) (err ERR-NOT-AUTHORIZED))
    ;; Vote should be casted after the start-block-height
    (asserts! (>= block-height (get start-block-height proposal)) (err ERR-NOT-AUTHORIZED))
    ;; Voter should be able to stake
    (try! (contract-call? .arkadiko-token transfer amount tx-sender (as-contract tx-sender)))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      (merge proposal { no-votes: (+ amount (get no-votes proposal)) }))
    (map-set votes-by-member 
      { proposal-id: proposal-id, member: tx-sender }
      { vote-count: (+ vote-count amount) })
    (ok STATUS-OK)
  )
)

(define-public (end-proposal (proposal-id uint))
  (let ((proposal (get-proposal-by-id proposal-id)))
    (asserts! (not (is-eq (get id proposal) u0)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-open proposal) true) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= block-height (get end-block-height proposal)) (err ERR-NOT-AUTHORIZED))

    (map-set proposals
      { id: proposal-id }
      (merge proposal { is-open: false }))
    (ok STATUS-OK)
  )
)

;; (define-private (return-diko (data (tuple (proposal-id uint) (member principal))))
;;   (map-set votes-by-member { proposal-id: proposal-id, member: principal } { vote-count: (+ vote-count amount) })
;;   (ok true)
;; )

;; Pay all parties:
;; - Owners of vaults
;; - DAO Reserve
;; - Owners of gov tokens
;; Unfortunately this cannot happen trustless
;; The bitcoin arrives at the bitcoin address passed to the initiate-stacking function
;; it is not possible to transact bitcoin txs from clarity right now
;; this means we will need to do this manually until some way exists to do this trustless (if ever?)
(define-public (payout)
  (ok true)
)

(define-public (request-diko-tokens (ft <mock-ft-trait>) (collateral-amount uint))
  (contract-call? ft transfer collateral-amount (get-dao-owner) (as-contract .sip10-reserve))
)

;; Initialize the contract
;; Test environments
(begin
  ;; (if is-in-regtest
    ;; (begin
      ;; Create:
      ;; - 2 collateral types stx-a and stx-b,
      ;; - 1 proposal type change_risk_parameter
      ;; - 1 proposal type add_collateral_type
      ;; - 1 proposal type stacking_distribution
      ;; - 1 proposal type emergency_shutdown
      (map-set collateral-types
        { token: "STX-A" }
        {
          name: "Stacks",
          token: "STX",
          token-type: "STX-A",
          url: "https://www.stacks.co/",
          total-debt: u0,
          liquidation-ratio: u150,
          collateral-to-debt-ratio: u200,
          maximum-debt: u100000000000000,
          liquidation-penalty: u10,
          stability-fee: u1648, ;; 0.001363077% daily percentage == 1% APY
          stability-fee-apy: u50 ;; 50 basis points
        }
      )
      (map-set collateral-types
        { token: "STX-B" }
        {
          name: "Stacks",
          token: "STX",
          token-type: "STX-B",
          url: "https://www.stacks.co/",
          total-debt: u0,
          liquidation-ratio: u115,
          collateral-to-debt-ratio: u200,
          maximum-debt: u10000000000000,
          liquidation-penalty: u10,
          stability-fee: u2726, ;; 0.002726155% daily percentage == 1% APY
          stability-fee-apy: u100 ;; 100 basis points
        }
      )
      (map-set collateral-types
        { token: "DIKO-A" }
        {
          name: "Arkadiko",
          token: "DIKO",
          token-type: "DIKO-A",
          url: "https://www.arkadiko.finance/",
          total-debt: u0,
          liquidation-ratio: u200,
          collateral-to-debt-ratio: u300,
          maximum-debt: u10000000000000,
          liquidation-penalty: u13,
          stability-fee: u2726, ;; 0.002726155% daily percentage == 1% APY
          stability-fee-apy: u100
        }
      )
      (map-set proposal-types
        { type: "change_risk_parameter" }
        {
          changes-keys: (list "liquidation-ratio" "collateral-to-debt-ratio" "maximum-debt" "liquidation-penalty" "stability-fee-apy" "minimum-vault-debt")
        }
      )
      (map-set proposal-types
        { type: "add_collateral_type" }
        {
          changes-keys: (list
            "collateral_token"
            "collateral_name"
            "liquidation-ratio"
            "collateral-to-debt-ratio"
            "maximum-debt"
            "liquidation-penalty"
            "stability-fee-apy"
            "minimum-vault-debt"
          )
        }
      )
      (map-set proposal-types
        { type: "stacking_distribution" }
        {
          changes-keys: (list "stacker_yield" "governance_token_yield" "governance_reserve_yield")
        }
      )
      (map-set proposal-types
        { type: "emergency_shutdown" }
        {
          changes-keys: (list "")
        }
      )
    ;; )
    ;; true
  ;; )
)