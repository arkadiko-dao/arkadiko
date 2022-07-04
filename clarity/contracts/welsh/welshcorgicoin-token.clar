(define-constant ERR-UNAUTHORIZED u1)
(define-constant ERR-YOU-POOR u2)
(define-fungible-token welshcorgicoin)
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-constant contract-creator tx-sender)
(impl-trait .sip-010-trait-ft-standard.sip-010-trait)

;; SIP-010 Standard

(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq from tx-sender)
            (err ERR-UNAUTHORIZED))

        (ft-transfer? welshcorgicoin amount from to)
    )
)

(define-read-only (get-name)
    (ok "Welshcorgicoin")
)

(define-read-only (get-symbol)
    (ok "WELSH")
)

(define-read-only (get-decimals)
    (ok u6)
)

(define-read-only (get-balance (user principal))
    (ok (ft-get-balance welshcorgicoin user)
    )
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply welshcorgicoin)
    )
)

(define-public (set-token-uri (value (string-utf8 256)))
    (if 
        (is-eq tx-sender contract-creator) 
            (ok (var-set token-uri (some value))) 
        (err ERR-UNAUTHORIZED)
    )
)

(define-read-only (get-token-uri)
    (ok (var-get token-uri)
    )
)

;; send-many

(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) })))
  (fold check-err
    (map send-token recipients)
    (ok true)
  )
)

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior ok-value result
               err-value (err err-value)
  )
)

(define-private (send-token (recipient { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (send-token-with-memo (get amount recipient) (get to recipient) (get memo recipient))
)

(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))
  (let
    ((transferOk (try! (transfer amount tx-sender to memo))))
    (ok transferOk)
  )
)


(begin
  (try! (ft-mint? welshcorgicoin u1000000000000 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC))
  (try! (ft-mint? welshcorgicoin u1000000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
  (try! (ft-mint? welshcorgicoin u1000000000000 'ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF))
  (try! (ft-mint? welshcorgicoin u1000000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
  (try! (ft-mint? welshcorgicoin u1000000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
)