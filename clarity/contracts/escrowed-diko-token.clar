;; TOOD: update address
(impl-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .arkadiko-dao-token-trait-v1.dao-token-trait)

(define-fungible-token esdiko)

(define-data-var token-uri (string-utf8 256) u"")

;; errors
(define-constant ERR-NOT-AUTHORIZED u1401)

;; ---------------------------------------------------------
;; Maps
;; ---------------------------------------------------------

(define-map vesting 
  { staker: principal } 
  {
    last-update-block: uint,
    stake-amount: uint
  }
)

(define-read-only (get-vesting-of (staker principal))
  (default-to
    { last-update-block: u0, stake-amount: u0 }
    (map-get? vesting { staker: staker })
  )
)

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply esdiko))
)

(define-read-only (get-name)
  (ok "Escrowed Arkadiko Token")
)

(define-read-only (get-symbol)
  (ok "esDIKO")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance esdiko account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender .arkadiko-dao)
    (ok (var-set token-uri value))
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  
  ;; TODO: whitelist sender/recipient
  (err ERR-NOT-AUTHORIZED)

  ;; (begin
  ;;   (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))

  ;;   (match (ft-transfer? esdiko amount sender recipient)
  ;;     response (begin
  ;;       (print memo)
  ;;       (ok response)
  ;;     )
  ;;     error (err error)
  ;;   )
  ;; )
)

;; ---------------------------------------------------------
;; DAO token trait
;; ---------------------------------------------------------

;; Mint method for DAO
(define-public (mint-for-dao (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-mint? esdiko amount recipient)
  )
)

;; Burn method for DAO
(define-public (burn-for-dao (amount uint) (sender principal))
  (begin
    (asserts! (is-eq contract-caller .arkadiko-dao) (err ERR-NOT-AUTHORIZED))
    (ft-burn? esdiko amount sender)
  )
)

;; Burn external
(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    (ft-burn? esdiko amount sender)
  )
)

;; ---------------------------------------------------------
;; Vesting
;; ---------------------------------------------------------

(define-public (update-staking (staker principal) (amount uint))
  (let (
    (diko-to-claim (calculate-vested-diko staker))
  )
    ;; TODO: only pool can call this method

    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-to-claim staker))

    ;; TODO: calculate amount to burn and burn

    (map-set vesting { staker: staker } { last-update-block: block-height, stake-amount: amount })
    (ok diko-to-claim)
  )
)

(define-read-only (calculate-vested-diko (staker principal)) 
  (let (
    (vesting-info (get-vesting-of staker))
    (block-diff (- block-height (get last-update-block vesting-info)))
    (esdiko-balance (get-balance staker))
  )
    ;; TODO
    u123
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

;; Test environments
(begin
  ;; TODO: do not do this on testnet or mainnet
  (try! (ft-mint? esdiko u890000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
)
