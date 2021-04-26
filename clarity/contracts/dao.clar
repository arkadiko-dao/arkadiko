(use-trait mock-ft-trait .mock-ft-trait.mock-ft-trait)
(use-trait dao-token-trait .dao-token-trait.dao-token-trait)

;; Arkadiko DAO 
;; 
;; Keep contracts used in protocol. 
;; Emergency switch to shut down protocol.


;; Errors
(define-constant ERR-NOT-AUTHORIZED (err u100401))

;; Constants
(define-constant DAO-OWNER tx-sender)

;; Contract addresses
(define-map contracts
  { name: (string-ascii 256) }
  {
    address: principal, ;; e.g. 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7
    qualified-name: principal ;; e.g. 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie
  }
)
(define-map contracts-data
  { qualified-name: principal }
  {
    active: bool
  }
)

;; Variables
(define-data-var emergency-shutdown-activated bool false)

;; TODO: 
;; Emergency shutdown should be on freddie?
;; Like our stake-registry which can deactivate pools
;; Each part can shut down independently
(define-read-only (get-emergency-shutdown-activated)
  (ok (var-get emergency-shutdown-activated))
)

;; Get contract address
(define-read-only (get-contract-address-by-name (name (string-ascii 256)))
  (get address (map-get? contracts { name: name }))
)

;; Get contract qualified name
(define-read-only (get-qualified-name-by-name (name (string-ascii 256)))
  (get qualified-name (map-get? contracts { name: name }))
)

;; Check if contract is active in the protocol
(define-read-only (get-contract-active-by-qualified-name (qualified-name principal))
  (default-to 
    false
    (get active (map-get? contracts-data { qualified-name: qualified-name }))
  )
)

;; Governance contract can setup DAO contracts
(define-public (set-contract-address (name (string-ascii 256)) (address principal) (qualified-name principal))
  (let (
    (prev-qualified-name (get qualified-name (unwrap-panic (map-get? contracts { name: name }))))
  )
    (begin
      (asserts! (is-eq (unwrap-panic (get-qualified-name-by-name "governance")) contract-caller) ERR-NOT-AUTHORIZED)
      (map-set contracts { name: name } { address: address, qualified-name: qualified-name })
      (map-set contracts-data { qualified-name: prev-qualified-name } { active: false })
      (map-set contracts-data { qualified-name: qualified-name } { active: true })
      (ok true)
    )
  )
)

;; ---------------------------------------------------------
;; Protocol tokens
;; ---------------------------------------------------------

;; Mint protocol tokens
(define-public (mint-token (token <dao-token-trait>) (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq (get-contract-active-by-qualified-name contract-caller) true) ERR-NOT-AUTHORIZED)
    (contract-call? token mint-for-dao amount recipient)
  )
)

;; Burn protocol tokens
(define-public (burn-token (token <dao-token-trait>) (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq (get-contract-active-by-qualified-name contract-caller) true) ERR-NOT-AUTHORIZED)
    (try! (contract-call? token burn-for-dao amount recipient))
    (ok true)
  )
)

;; TODO: make sip10 trait dynamic
;; Philip, why is this needed??
(define-public (request-diko-tokens (ft <mock-ft-trait>) (collateral-amount uint))
  (contract-call? ft transfer collateral-amount DAO-OWNER (as-contract .sip10-reserve))
)


;; ---------------------------------------------------------
;; Contract initialisation
;; ---------------------------------------------------------

;; Initialize the contract
(begin
  ;; Add initial contracts
  (map-set contracts
    { name: "freddie" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie
    }
  )
  (map-set contracts-data
    { qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.freddie }
    {
      active: true
    }
  )

  (map-set contracts
    { name: "auction-engine" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.auction-engine
    }
  )
  (map-set contracts-data
    { qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.auction-engine }
    {
      active: true
    }
  )

  (map-set contracts
    { name: "oracle" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.oracle
    }
  )
  (map-set contracts
    { name: "collateral-types" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.collateral-types
    }
  )
  (map-set contracts
    { name: "governance" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.governance
    }
  )
  (map-set contracts
    { name: "stake-registry" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-registry
    }
  )

  (map-set contracts
    { name: "stake-pool-diko" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko
    }
  )
  (map-set contracts-data
    { qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stake-pool-diko }
    {
      active: true
    }
  )

  (map-set contracts
    { name: "stacker" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stacker
    }
  )
  (map-set contracts
    { name: "stx-reserve" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve
    }
  )
  (map-set contracts-data
    { qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.stx-reserve }
    {
      active: true
    }
  )

  (map-set contracts
    { name: "sip10-reserve" }
    {
      address: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7,
      qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve
    }
  )
  (map-set contracts-data
    { qualified-name: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve }
    {
      active: true
    }
  )
)
