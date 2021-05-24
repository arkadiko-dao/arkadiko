(use-trait mock-ft-trait .arkadiko-mock-ft-trait-v1.mock-ft-trait)

;; Arkadiko governance
;; 
;; Can see, vote and submit a new proposal
;; A proposal will just update the DAO with new contracts.

;; Errors
(define-constant ERR-NOT-ENOUGH-BALANCE u31)
(define-constant ERR-NO-CONTRACT-CHANGES u32)
(define-constant ERR-WRONG-TOKEN u33)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u34)
(define-constant ERR-NOT-AUTHORIZED u3401)
(define-constant STATUS-OK u3200)

;; Constants
(define-constant DAO-OWNER tx-sender)

;; Proposal variables
(define-map proposals
  { id: uint }
  {
    id: uint,
    proposer: principal,
    details: (string-utf8 256),
    is-open: bool,
    start-block-height: uint,
    end-block-height: uint,
    yes-votes: uint,
    no-votes: uint,
    contract-changes: (list 10 (tuple (name (string-ascii 256)) (address principal) (qualified-name principal)))
  }
)

(define-data-var governance-shutdown-activated bool false)
(define-data-var proposal-count uint u0)
(define-data-var proposal-ids (list 100 uint) (list u0))
(define-map votes-by-member { proposal-id: uint, member: principal } { vote-count: uint })
(define-map tokens-by-member { proposal-id: uint, member: principal, token: principal } { amount: uint })

;; Get all proposals
(define-read-only (get-proposals)
  (ok (map get-proposal-by-id (var-get proposal-ids)))
)

;; Get all proposal IDs
(define-read-only (get-proposal-ids)
  (ok (var-get proposal-ids))
)

;; Get votes for a member on proposal
(define-read-only (get-votes-by-member-by-id (proposal-id uint) (member principal))
  (default-to 
    { vote-count: u0 }
    (map-get? votes-by-member { proposal-id: proposal-id, member: member })
  )
)

(define-read-only (get-tokens-by-member-by-id (proposal-id uint) (member principal) (token <mock-ft-trait>))
  (default-to 
    { amount: u0 }
    (map-get? tokens-by-member { proposal-id: proposal-id, member: member, token: (contract-of token) }) 
  )
)

;; Get proposal details
(define-read-only (get-proposal-by-id (proposal-id uint))
  (default-to
    {
      id: u0,
      proposer: DAO-OWNER,
      details: u"",
      is-open: false,
      start-block-height: u0,
      end-block-height: u0,
      yes-votes: u0,
      no-votes: u0,
      contract-changes: (list { name: "", address: DAO-OWNER, qualified-name: DAO-OWNER} )
    }
    (map-get? proposals { id: proposal-id })
  )
)

;; To check which tokens are accepted as votes
(define-read-only (is-token-accepted (token <mock-ft-trait>))
  (let (
    (is-diko (is-eq (contract-of token) .arkadiko-token))
    (is-stdiko (is-eq (contract-of token) .stake-pool-diko))
  )
    (or is-diko is-stdiko)
  )
)

(define-public (toggle-governance-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set governance-shutdown-activated (not (var-get governance-shutdown-activated))))
  )
)

;; Start a proposal
;; Requires 1% of the supply in your wallet
;; Default voting period is 10 days (144 * 10 blocks)
(define-public (propose
    (start-block-height uint)
    (details (string-utf8 256))
    (contract-changes (list 10 (tuple (name (string-ascii 256)) (address principal) (qualified-name principal))))
  )
  (let (
    (proposer-balance (unwrap-panic (contract-call? .arkadiko-token get-balance-of tx-sender)))
    (diko-init-balance (unwrap-panic (contract-call? .arkadiko-token get-balance-of .arkadiko-diko-init)))
    (supply (- (unwrap-panic (contract-call? .arkadiko-token get-total-supply)) diko-init-balance))
    (proposal-id (+ u1 (var-get proposal-count)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; Requires 1% of the supply 
    (asserts! (>= (* proposer-balance u100) supply) (err ERR-NOT-ENOUGH-BALANCE))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      {
        id: proposal-id,
        proposer: tx-sender,
        details: details,
        is-open: true,
        start-block-height: start-block-height,
        end-block-height: (+ start-block-height u1440),
        yes-votes: u0,
        no-votes: u0,
        contract-changes: contract-changes
      }
    )
    (var-set proposal-count proposal-id)
    (var-set proposal-ids (unwrap-panic (as-max-len? (append (var-get proposal-ids) proposal-id) u100)))
    (ok true)
  )
)

(define-public (vote-for (token <mock-ft-trait>) (proposal-id uint) (amount uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (vote-count (get vote-count (get-votes-by-member-by-id proposal-id tx-sender)))
    (token-count (get amount (get-tokens-by-member-by-id proposal-id tx-sender token)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; Can vote with DIKO and stDIKO
    (asserts! (is-eq (is-token-accepted token) true) (err ERR-WRONG-TOKEN))
    ;; Proposal should be open for voting
    (asserts! (is-eq (get is-open proposal) true) (err ERR-NOT-AUTHORIZED))
    ;; Vote should be casted after the start-block-height
    (asserts! (>= block-height (get start-block-height proposal)) (err ERR-NOT-AUTHORIZED))
    ;; Voter should be able to stake
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      (merge proposal { yes-votes: (+ amount (get yes-votes proposal)) }))
    (map-set votes-by-member 
      { proposal-id: proposal-id, member: tx-sender }
      { vote-count: (+ vote-count amount) })
    (map-set tokens-by-member
      { proposal-id: proposal-id, member: tx-sender, token: (contract-of token) }
      { amount: (+ token-count amount) })

    (ok STATUS-OK)
  )
)

(define-public (vote-against (token <mock-ft-trait>) (proposal-id uint) (amount uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (vote-count (get vote-count (get-votes-by-member-by-id proposal-id tx-sender)))
    (token-count (get amount (get-tokens-by-member-by-id proposal-id tx-sender token)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )

    ;; Can vote with DIKO and stDIKO
    (asserts! (is-eq (is-token-accepted token) true) (err ERR-WRONG-TOKEN))
    ;; Proposal should be open for voting
    (asserts! (is-eq (get is-open proposal) true) (err ERR-NOT-AUTHORIZED))
    ;; Vote should be casted after the start-block-height
    (asserts! (>= block-height (get start-block-height proposal)) (err ERR-NOT-AUTHORIZED))
    ;; Voter should be able to stake
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      (merge proposal { no-votes: (+ amount (get no-votes proposal)) }))
    (map-set votes-by-member 
      { proposal-id: proposal-id, member: tx-sender }
      { vote-count: (+ vote-count amount) })
    (map-set tokens-by-member
      { proposal-id: proposal-id, member: tx-sender, token: (contract-of token) }
      { amount: (+ token-count amount) })
    (ok STATUS-OK)
  )
)

(define-public (end-proposal (proposal-id uint))
  (let ((proposal (get-proposal-by-id proposal-id)))
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (not (is-eq (get id proposal) u0)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get is-open proposal) true) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= block-height (get end-block-height proposal)) (err ERR-NOT-AUTHORIZED))

    (map-set proposals
      { id: proposal-id }
      (merge proposal { is-open: false }))
    (if (> (get yes-votes proposal) (get no-votes proposal))
      (try! (execute-proposal proposal-id))
      false
    )
    (ok STATUS-OK)
  )
)

;; Return votes to voter
(define-public (return-votes-to-member (token <mock-ft-trait>) (proposal-id uint) (member principal))
  (let (
    (token-count (get amount (get-tokens-by-member-by-id proposal-id member token)))
    (proposal (get-proposal-by-id proposal-id))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts! (is-eq (is-token-accepted token) true) (err ERR-WRONG-TOKEN))
    (asserts! (is-eq (get is-open proposal) false) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= block-height (get end-block-height proposal)) (err ERR-NOT-AUTHORIZED))

    ;; Return DIKO
    (contract-call? token transfer token-count (as-contract tx-sender) member none)
  )
)

;; Make needed contract changes on DAO
(define-private (execute-proposal (proposal-id uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (contract-changes (get contract-changes proposal))
  )
    (if (> (len contract-changes) u0)
      (begin
        (map execute-proposal-change-contract contract-changes)
        (ok true)
      )
      (err ERR-NO-CONTRACT-CHANGES)
    )
  )
)

;; Helper to execute proposal and change contracts
(define-private (execute-proposal-change-contract (change (tuple (name (string-ascii 256)) (address principal) (qualified-name principal))))
  (let (
    (name (get name change))
    (address (get address change))
    (qualified-name (get qualified-name change))
  )
    (if (not (is-eq name ""))
      (begin
        (try! (contract-call? .arkadiko-dao set-contract-address name address qualified-name))
        (ok true)
      )
      (ok false)
    )
  )
)
