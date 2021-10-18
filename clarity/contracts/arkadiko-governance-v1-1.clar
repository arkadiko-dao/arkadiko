;; @contract Arkadiko governance
;; Can see, vote and submit a new proposal
;; A proposal will just update the DAO with new contracts.
;; @version 1.1

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait stake-pool-diko-trait .arkadiko-stake-pool-diko-trait-v1.stake-pool-diko-trait)

;; Errors
(define-constant ERR-NOT-ENOUGH-BALANCE u31)
(define-constant ERR-NO-CONTRACT-CHANGES u32)
(define-constant ERR-WRONG-TOKEN u33)
(define-constant ERR-EMERGENCY-SHUTDOWN-ACTIVATED u34)
(define-constant ERR-BLOCK-HEIGHT-NOT-REACHED u35)
(define-constant ERR-BLOCK-HEIGHT-PASSED u36)
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
    title: (string-utf8 256),
    url: (string-utf8 256),
    is-open: bool,
    start-block-height: uint,
    end-block-height: uint,
    yes-votes: uint,
    no-votes: uint,
    contract-changes: (list 10 (tuple (name (string-ascii 256)) (address principal) (qualified-name principal) (can-mint bool) (can-burn bool)))
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

(define-read-only (get-tokens-by-member-by-id (proposal-id uint) (member principal) (token <ft-trait>))
  (default-to 
    { amount: u0 }
    (map-get? tokens-by-member { proposal-id: proposal-id, member: member, token: (contract-of token) }) 
  )
)

;; Get proposal
(define-read-only (get-proposal-by-id (proposal-id uint))
  (default-to
    {
      id: u0,
      proposer: DAO-OWNER,
      title: u"",
      url: u"",
      is-open: false,
      start-block-height: u0,
      end-block-height: u0,
      yes-votes: u0,
      no-votes: u0,
      contract-changes: (list { name: "", address: DAO-OWNER, qualified-name: DAO-OWNER, can-mint: false, can-burn: false} )
    }
    (map-get? proposals { id: proposal-id })
  )
)

;; To check which tokens are accepted as votes
(define-read-only (is-token-accepted (token <ft-trait>))
  (let (
    (is-diko (is-eq (contract-of token) .arkadiko-token))
    (is-stdiko (is-eq (contract-of token) .stdiko-token))
  )
    (or is-diko is-stdiko)
  )
)

(define-public (toggle-governance-shutdown)
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-guardian-address)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set governance-shutdown-activated (not (var-get governance-shutdown-activated))))
  )
)

;; @desc Start a proposal. Requires 1% of the supply in your wallet. Voting period is ~10 days.
;; @param stake-pool-diko; DIKO pool to get stDIKO/DIKO ratio from
;; @param start-block-height; block at which voting starts
;; @param title; title for the proposal
;; @param url; link to poposal details
;; @param contract-changes; contracts to update in DAO
;; @post boolean; returns true if propsal was created
(define-public (propose
  (stake-pool-diko <stake-pool-diko-trait>)
  (start-block-height uint)
  (title (string-utf8 256))
  (url (string-utf8 256))
  (contract-changes (list 10 (tuple (name (string-ascii 256)) (address principal) (qualified-name principal) (can-mint bool) (can-burn bool))))
)
  (let (
    (proposer-diko-balance (unwrap-panic (contract-call? .arkadiko-token get-balance tx-sender)))
    (proposer-stdiko-balance (unwrap-panic (contract-call? .stdiko-token get-balance tx-sender)))
    
    (proposer-diko-votes (unwrap-panic (token-amount-to-votes stake-pool-diko .arkadiko-token proposer-diko-balance)))
    (proposer-stdiko-votes (unwrap-panic (token-amount-to-votes stake-pool-diko .stdiko-token proposer-stdiko-balance)))
    (proposer-total-balance (+ proposer-diko-votes proposer-stdiko-votes))

    (diko-init-balance (unwrap-panic (contract-call? .arkadiko-token get-balance .arkadiko-diko-init)))
    (supply (- (unwrap-panic (contract-call? .arkadiko-token get-total-supply)) diko-init-balance))
    (proposal-id (+ u1 (var-get proposal-count)))
    (proposal {
      id: proposal-id,
      proposer: tx-sender,
      title: title,
      url: url,
      is-open: true,
      start-block-height: start-block-height,
      end-block-height: (+ start-block-height u1440),
      yes-votes: u0,
      no-votes: u0,
      contract-changes: contract-changes
    })
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts!
      (is-eq
        (contract-of stake-pool-diko)
        (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-pool-diko"))
      )
      (err ERR-NOT-AUTHORIZED)
    )
    (asserts! (>= start-block-height block-height) (err ERR-BLOCK-HEIGHT-PASSED))

    ;; Requires 1% of the supply 
    (asserts! (>= (* proposer-total-balance u100) supply) (err ERR-NOT-ENOUGH-BALANCE))
    ;; Mutate
    (map-set proposals
      { id: proposal-id }
      proposal
    )
    (var-set proposal-count proposal-id)
    (var-set proposal-ids (unwrap-panic (as-max-len? (append (var-get proposal-ids) proposal-id) u100)))
    (print { type: "proposal", action: "created", data: proposal })
    (ok true)
  )
)

;; @desc translate tokens to amount of votes - stDIKO to DIKO to votes
;; @param stake-pool-diko; DIKO stake pool to get DIKO/stDIKO ratio from
;; @param token; proposal to vote for
;; @param amount; amount of tokens
;; @post uint; amount of votes
(define-public (token-amount-to-votes (stake-pool-diko <stake-pool-diko-trait>) (token <ft-trait>) (amount uint))
  (begin
    (asserts! (is-eq (contract-of stake-pool-diko) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-pool-diko"))) (err ERR-NOT-AUTHORIZED))
    (if (is-eq (contract-of token) .arkadiko-token)
      (ok amount)
      (let (
        (diko-stdiko (unwrap-panic (contract-call? stake-pool-diko diko-stdiko-ratio)))
      )
        (ok (/ (* amount diko-stdiko) u1000000))
      )
    )
  )
)

;; @desc vote for a proposal
;; @param stake-pool-diko; DIKO stake pool to get DIKO/stDIKO ratio from
;; @param token; token used to vote (DIKO or stDIKO)
;; @param proposal-id; proposal to vote for
;; @param amount; amount of votes (tokens)
;; @post uint; returns 3200 when votes accepted
(define-public (vote-for (stake-pool-diko <stake-pool-diko-trait>) (token <ft-trait>) (proposal-id uint) (amount uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (vote-count (get vote-count (get-votes-by-member-by-id proposal-id tx-sender)))
    (token-count (get amount (get-tokens-by-member-by-id proposal-id tx-sender token)))
    (add-vote-count (unwrap-panic (token-amount-to-votes stake-pool-diko token amount)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts!
      (is-eq
        (contract-of stake-pool-diko)
        (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-pool-diko"))
      )
      (err ERR-NOT-AUTHORIZED)
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
      (merge proposal { yes-votes: (+ add-vote-count (get yes-votes proposal)) }))
    (map-set votes-by-member 
      { proposal-id: proposal-id, member: tx-sender }
      { vote-count: (+ vote-count add-vote-count) })
    (map-set tokens-by-member
      { proposal-id: proposal-id, member: tx-sender, token: (contract-of token) }
      { amount: (+ token-count amount) })

    (print { type: "proposal", action: "voted", data: proposal })
    (ok STATUS-OK)
  )
)

;; @desc vote against a proposal
;; @param stake-pool-diko; DIKO stake pool to get DIKO/stDIKO ratio from
;; @param token; token used to vote (DIKO or stDIKO)
;; @param proposal-id; proposal to vote against
;; @param amount; amount of votes (tokens)
;; @post uint; returns 3200 when votes accepted
(define-public (vote-against (stake-pool-diko <stake-pool-diko-trait>) (token <ft-trait>) (proposal-id uint) (amount uint))
  (let (
    (proposal (get-proposal-by-id proposal-id))
    (vote-count (get vote-count (get-votes-by-member-by-id proposal-id tx-sender)))
    (token-count (get amount (get-tokens-by-member-by-id proposal-id tx-sender token)))
    (add-vote-count (unwrap-panic (token-amount-to-votes stake-pool-diko token amount)))
  )
    (asserts!
      (and
        (is-eq (unwrap-panic (contract-call? .arkadiko-dao get-emergency-shutdown-activated)) false)
        (is-eq (var-get governance-shutdown-activated) false)
      )
      (err ERR-EMERGENCY-SHUTDOWN-ACTIVATED)
    )
    (asserts!
      (is-eq
        (contract-of stake-pool-diko)
        (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "stake-pool-diko"))
      )
      (err ERR-NOT-AUTHORIZED)
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
      (merge proposal { no-votes: (+ add-vote-count (get no-votes proposal)) }))
    (map-set votes-by-member 
      { proposal-id: proposal-id, member: tx-sender }
      { vote-count: (+ vote-count add-vote-count) })
    (map-set tokens-by-member
      { proposal-id: proposal-id, member: tx-sender, token: (contract-of token) }
      { amount: (+ token-count amount) })
    (print { type: "proposal", action: "voted", data: proposal })
    (ok STATUS-OK)
  )
)

;; @desc end a proposal and execute the changes
;; @param proposal-id; proposal to execute
;; @post uint; returns 3200 when executed
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
    (asserts! (>= block-height (get end-block-height proposal)) (err ERR-BLOCK-HEIGHT-NOT-REACHED))

    (map-set proposals
      { id: proposal-id }
      (merge proposal { is-open: false }))
    (if (> (get yes-votes proposal) (get no-votes proposal))
      (try! (execute-proposal proposal-id))
      false
    )
    (print { type: "proposal", action: "ended", data: proposal })
    (ok STATUS-OK)
  )
)

;; @desc  Return votes (DIKO or stDIKO tokens) to voter
;; @param token; token to return (DIKO or stDIKO)
;; @param proposal-id; proposal for which to return tokens
;; @param member; voter to return tokens to
;; @post uint; returns result of token transfer from governance to voter
(define-public (return-votes-to-member (token <ft-trait>) (proposal-id uint) (member principal))
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

    (map-set tokens-by-member
      { proposal-id: proposal-id, member: member, token: (contract-of token) }
      { amount: u0 })

    ;; Return DIKO or stDIKO
    (as-contract (contract-call? token transfer token-count tx-sender member none))
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
        (print { type: "proposal", action: "executed", data: proposal })
        (ok true)
      )
      (err ERR-NO-CONTRACT-CHANGES)
    )
  )
)

;; Helper to execute proposal and change contracts
(define-private (execute-proposal-change-contract (change (tuple (name (string-ascii 256)) (address principal) (qualified-name principal) (can-mint bool) (can-burn bool))))
  (let (
    (name (get name change))
    (address (get address change))
    (qualified-name (get qualified-name change))
    (can-mint (get can-mint change))
    (can-burn (get can-burn change))
  )
    (if (not (is-eq name ""))
      (begin
        (try! (contract-call? .arkadiko-dao set-contract-address name address qualified-name can-mint can-burn))
        (ok true)
      )
      (ok false)
    )
  )
)

;; @desc  adds a new contract to the protocol, only new ones allowed
;; @param name; name for the new contract
;; @param address; address of the contract to add tot he DAO
;; @param qualified-name; qualified name for the new contract
;; @param can-mint; indication if new contract should be able to mint protocol tokens
;; @param can-burn; indication if new contract should be able to burn protocol tokens
;; @post boolean; returns true if contract added or false when contract already exists
(define-public (add-contract-address (name (string-ascii 256)) (address principal) (qualified-name principal) (can-mint bool) (can-burn bool))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (if (is-some (contract-call? .arkadiko-dao get-contract-address-by-name name))
      (ok false)
      (begin
        (try! (contract-call? .arkadiko-dao set-contract-address name address qualified-name can-mint can-burn))
        (ok true)
      )
    )
  )
)
