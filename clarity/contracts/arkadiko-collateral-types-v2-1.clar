;; @contract Smart Contract that keeps all collateral types accepted by the DAO
;; @version 1

(impl-trait .arkadiko-collateral-types-trait-v1.collateral-types-trait)

(define-constant ERR-NOT-AUTHORIZED u17401)
(define-constant OWNER tx-sender)

(define-map collateral-types
  { name: (string-ascii 12) }
  {
    name: (string-ascii 256),
    token: (string-ascii 12),
    token-type: (string-ascii 12),
    token-address: principal,
    url: (string-ascii 256),
    total-debt: uint,
    liquidation-ratio: uint,
    collateral-to-debt-ratio: uint,
    maximum-debt: uint,
    liquidation-penalty: uint,
    stability-fee: uint,
    stability-fee-decimals: uint,
    stability-fee-apy: uint
  }
)

(define-read-only (get-collateral-type-by-name (name (string-ascii 12)))
  (ok
    (default-to
      {
        name: "",
        token: "",
        token-type: "",
        token-address: OWNER,
        url: "",
        total-debt: u1,
        liquidation-ratio: u0,
        collateral-to-debt-ratio: u0,
        maximum-debt: u0,
        liquidation-penalty: u0,
        stability-fee: u0,
        stability-fee-decimals: u0,
        stability-fee-apy: u0
      }
      (map-get? collateral-types { name: name })
    )
  )
)

(define-read-only (get-token-address (token (string-ascii 12)))
  (ok (get token-address (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-liquidation-ratio (token (string-ascii 12)))
  (ok (get liquidation-ratio (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-collateral-to-debt-ratio (token (string-ascii 12)))
  (ok (get collateral-to-debt-ratio (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-maximum-debt (token (string-ascii 12)))
  (ok (get maximum-debt (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-total-debt (token (string-ascii 12)))
  (ok (get total-debt (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-liquidation-penalty (token (string-ascii 12)))
  (ok (get liquidation-penalty (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-stability-fee (token (string-ascii 12)))
  (ok (get stability-fee (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-stability-fee-decimals (token (string-ascii 12)))
  (ok (get stability-fee-decimals (unwrap-panic (get-collateral-type-by-name token))))
)

(define-read-only (get-stability-fee-apy (token (string-ascii 12)))
  (ok (get stability-fee-apy (unwrap-panic (get-collateral-type-by-name token))))
)

;; public methods
(define-public (add-debt-to-collateral-type (token (string-ascii 12)) (debt uint))
  (begin
    ;; freddie should be calling this method
    (asserts! (is-eq contract-caller .arkadiko-freddie-v1-1) (err ERR-NOT-AUTHORIZED))
    (let ((collateral-type (unwrap-panic (get-collateral-type-by-name token))))
      (map-set collateral-types
        { name: token }
        (merge collateral-type { total-debt: (+ debt (get total-debt collateral-type)) }))
      (ok debt)
    )
  )
)

(define-public (subtract-debt-from-collateral-type (token (string-ascii 12)) (debt uint))
  (begin
    ;; freddie should be calling this method
    (asserts! (is-eq contract-caller .arkadiko-freddie-v1-1) (err ERR-NOT-AUTHORIZED))
    (let ((collateral-type (unwrap-panic (get-collateral-type-by-name token))))
      (if (> (get total-debt collateral-type) debt)
        (map-set collateral-types { name: token } (merge collateral-type { total-debt: (- (get total-debt collateral-type) debt) }))
        (map-set collateral-types { name: token } (merge collateral-type { total-debt: u0 }))
      )
      (ok debt)
    )
  )
)

(define-public (change-risk-parameters (collateral-type (string-ascii 12)) (changes (list 10 (tuple (key (string-ascii 256)) (new-value uint)))))
  (let (
    (type (unwrap-panic (get-collateral-type-by-name collateral-type)))
    (result (fold change-risk-parameter changes type))
  )
    (asserts! (is-eq tx-sender OWNER) (err ERR-NOT-AUTHORIZED))

    (map-set collateral-types { name: collateral-type } result)
    (ok true)
  )
)

(define-public (change-token-address (collateral-type (string-ascii 12)) (address principal))
  (let (
    (type (unwrap-panic (get-collateral-type-by-name collateral-type)))
  )
    (asserts! (is-eq tx-sender OWNER) (err ERR-NOT-AUTHORIZED))

    (map-set collateral-types { name: collateral-type } (merge type { token-address: address }))
    (ok true)
  )
)

(define-private (change-risk-parameter (change (tuple (key (string-ascii 256)) (new-value uint)))
                                       (type (tuple (collateral-to-debt-ratio uint) (liquidation-penalty uint) (liquidation-ratio uint)
                                              (maximum-debt uint) (name (string-ascii 256)) (stability-fee uint) (stability-fee-apy uint) (stability-fee-decimals uint)
                                              (token (string-ascii 12)) (token-address principal) (token-type (string-ascii 12)) (total-debt uint) (url (string-ascii 256)))
                                       )
                )
  (let ((key (get key change)))
    (if (is-eq key "liquidation-penalty")
      (merge type {
        liquidation-penalty: (get new-value change)
      })
      (if (is-eq key "liquidation-ratio")
        (merge type {
          liquidation-ratio: (get new-value change)
        })
        (if (is-eq key "collateral-to-debt-ratio")
          (merge type {
            collateral-to-debt-ratio: (get new-value change)
          })
          (if (is-eq key "maximum-debt")
            (merge type {
              maximum-debt: (get new-value change)
            })
            (if (is-eq key "stability-fee")
              (merge type {
                stability-fee: (get new-value change)
              })
              (if (is-eq key "stability-fee-apy")
                (merge type {
                  stability-fee-apy: (get new-value change)
                })
                (if (is-eq key "stability-fee-decimals")
                  (merge type {
                    stability-fee-decimals: (get new-value change)
                  })
                  type
                )
              )
            )
          )
        )
      )
    )
  )
)

;; STX collateral types do not have a token address but this is not a problem
;; since we have `stx-transfer` methods hardcoded in the STX reserve
;; the address is important for custom FT traits
(begin
  (map-set collateral-types
    { name: "STX-A" }
    {
      name: "Stacks",
      token: "STX",
      token-type: "STX-A",
      token-address: .xstx-token,
      url: "https://www.stacks.co/",
      total-debt: u571001546892,
      liquidation-ratio: u175, ;; TODO: change to 140 on mainnet
      collateral-to-debt-ratio: u400, ;; TODO: change to u185 on mainnet (~52% LTV)
      maximum-debt: u3500000000000, ;; 3.5M
      liquidation-penalty: u1000, ;; 10% in basis points
      stability-fee: u7610350076, ;; 4% / 365 days / (24*6) blocks = 0.00007610350076 fee per block
      stability-fee-decimals: u16,
      stability-fee-apy: u400 ;; 400 basis points
    }
  )
  (map-set collateral-types
    { name: "STX-B" }
    {
      name: "Stacks",
      token: "STX",
      token-type: "STX-B",
      token-address: .xstx-token,
      url: "https://www.stacks.co/",
      total-debt: u17897073109,
      liquidation-ratio: u130,
      collateral-to-debt-ratio: u180, ;; ~55% LTV
      maximum-debt: u500000000000000, ;; 500M
      liquidation-penalty: u1300, ;; 13% in basis points
      stability-fee: u1331811263, ;; 7% / 365 days / (24*6) blocks = 0.0001331811263 fee per block
      stability-fee-decimals: u15,
      stability-fee-apy: u700 ;; 700 basis points
    }
  )
  (map-set collateral-types
    { name: "XBTC-A" }
    {
      name: "Wrapped Bitcoin",
      token: "xBTC",
      token-type: "xBTC-A",
      token-address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.Wrapped-Bitcoin, ;; TODO: use SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR on mainnet
      url: "https://www.tokensoft.io/",
      total-debt: u51474852253,
      liquidation-ratio: u130,
      collateral-to-debt-ratio: u180, ;; ~55% LTV
      maximum-debt: u1000000000000, ;; 1M
      liquidation-penalty: u1000, ;; 10% in basis points
      stability-fee: u7610350076, ;; 4% / 365 days / (24*6) blocks = 0.00007610350076 fee per block
      stability-fee-decimals: u16,
      stability-fee-apy: u400 ;; 400 basis points
    }
  )
  (map-set collateral-types
    { name: "ATALEX-A" }
    {
      name: "Auto ALEX",
      token: "atALEX",
      token-type: "atALEX-A",
      token-address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.auto-alex,
      url: "https://alexlab.co/",
      total-debt: u0,
      liquidation-ratio: u180, 
      collateral-to-debt-ratio: u400, ;; ~25% LTV
      maximum-debt: u200000000000, ;; 200K max debt
      liquidation-penalty: u2000, ;; 20% in basis points
      stability-fee: u7610350076, ;; 4% / 365 days / (24*6) blocks = 0.00007610350076 fee per block
      stability-fee-decimals: u16,
      stability-fee-apy: u400 ;; 400 basis points
    }
  )
)
