;; Wrapped STX token 
;; To have a SIP-010 representation of STX
;;

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token wstx)

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

(define-constant ERR_NOT_AUTHORIZED u990401)

;; ---------------------------------------------------------
;; Variables
;; ---------------------------------------------------------

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var protocol-addresses (list 20 principal) (list ))

;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------

(define-read-only (get-total-supply)
  (ok (ft-get-supply wstx))
)

(define-read-only (get-name)
  (ok "Wrapped Stacks Token")
)

(define-read-only (get-symbol)
  (ok "wSTX")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance wstx account))
)

(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (let (
    (sender-is-protocol (is-protocol-address sender))
    (recipient-is-protocol (is-protocol-address recipient))
  )
    (asserts! (is-eq tx-sender sender) (err ERR_NOT_AUTHORIZED))

    (if (and (not sender-is-protocol) recipient-is-protocol)
      ;; User to Protocol
      (begin
        (try! (stx-transfer? amount sender (as-contract tx-sender)))
        (try! (ft-mint? wstx amount sender))
        (try! (ft-transfer? wstx amount sender recipient))
      )

      (if (and sender-is-protocol (not recipient-is-protocol))
        ;; Protocol to User
        (begin
          (try! (ft-transfer? wstx amount sender recipient))
          (try! (ft-burn? wstx amount recipient))
          (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        )
        ;; Other
        (try! (ft-transfer? wstx amount sender recipient))
      )
    )

    (ok true)
  )
)

;; ---------------------------------------------------------
;; Protocol
;; ---------------------------------------------------------

(define-read-only (get-stx-balance (account principal))
  (stx-get-balance account)
)

(define-read-only (is-protocol-address (address principal))
  (is-some (index-of (var-get protocol-addresses) address))
)

(define-read-only (get-protocol-addresses)
  (var-get protocol-addresses)
)

;; ---------------------------------------------------------
;; Wrap / Unwrap
;; ---------------------------------------------------------

(define-public (wrap (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ft-mint? wstx amount tx-sender)
  )
)

(define-public (unwrap (amount uint))
  (let (
    (recipient tx-sender)
  )
    (try! (as-contract (stx-transfer? amount (as-contract tx-sender) recipient)))
    (ft-burn? wstx amount recipient)
  )
)

;; ---------------------------------------------------------
;; Admin
;; ---------------------------------------------------------

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner))
    (ok (var-set token-uri value))
    (err ERR_NOT_AUTHORIZED)
  )
)

(define-public (set-protocol-addresses (addresses (list 20 principal)))
  (begin
    (asserts! (is-eq contract-caller (contract-call? .arkadiko-dao get-dao-owner)) (err ERR_NOT_AUTHORIZED))

    (var-set protocol-addresses addresses)
    (ok true)
  )
)

;; ---------------------------------------------------------
;; Init
;; ---------------------------------------------------------

(begin
  (var-set protocol-addresses (list 
    .arkadiko-vaults-manager-v1-1
    .arkadiko-vaults-operations-v1-1
    .arkadiko-vaults-pool-active-v1-1
    .arkadiko-vaults-pool-fees-v1-1
    .arkadiko-vaults-pool-liq-v1-1
  ))
)
