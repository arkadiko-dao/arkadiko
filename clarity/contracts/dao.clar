;; Arkadiko DAO
;; 1. See all proposals
;; 2. Vote on a proposal
;; 3. Submit new proposal (hold token supply >= 1%)

(define-map proposals { id: uint }
  {
    proposer: principal,
    start-block-height: uint,
    end-block-height: uint,
    yes-votes: uint,
    no-votes: uint,
    details: (buff 256)
  }
)
(define-data-var proposal-count uint u0)
(define-map votes-by-member { proposal-index: uint, member: principal } { has-voted: (optional bool) })

;; (define-read-only (get-proposal-by-id? (proposal-id uint))
;;   (map-get? proposals {id: proposal-id})
;; )

;; (define-read-only (get-proposal-by-index? (proposal-index uint))
;;   (map-get? proposals {id: (id-queued-proposal proposal-index)})
;; )
