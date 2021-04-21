(impl-trait .collateral-types-trait.collateral-types-trait)

;; Smart Contract that keeps all collateral types accepted by the DAO

(define-constant ERR-NOT-AUTHORIZED u17401)

(define-map collateral-types
  { name: (string-ascii 12) }
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

(define-read-only (get-collateral-type-by-name (name (string-ascii 12)))
  (ok
    (default-to
      {
        name: "",
        token: "",
        token-type: "",
        url: "",
        total-debt: u0,
        liquidation-ratio: u0,
        collateral-to-debt-ratio: u0,
        maximum-debt: u0,
        liquidation-penalty: u0,
        stability-fee: u0,
        stability-fee-apy: u0
      }
      (map-get? collateral-types { name: name })
    )
  )
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

(define-read-only (get-stability-fee-apy (token (string-ascii 12)))
  (ok (get stability-fee-apy (unwrap-panic (get-collateral-type-by-name token))))
)

;; public methods
(define-public (add-debt-to-collateral-type (token (string-ascii 12)) (debt uint))
  (begin
    ;; freddie should be calling this method
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))
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
    (asserts! (is-eq contract-caller .freddie) (err ERR-NOT-AUTHORIZED))
    (let ((collateral-type (unwrap-panic (get-collateral-type-by-name token))))
      (map-set collateral-types
        { name: token }
        (merge collateral-type { total-debt: (- (get total-debt collateral-type) debt) }))
      (ok debt)
    )
  )
)

(define-public (add-collateral-type (token (string-ascii 12))
                                    (name (string-ascii 12))
                                    (url (string-ascii 256))
                                    (collateral-type (string-ascii 12))
                                    (liquidation-ratio uint)
                                    (liquidation-penalty uint)
                                    (stability-fee uint)
                                    (stability-fee-apy uint)
                                    (maximum-debt uint)
                                    (collateral-to-debt-ratio uint))
  (begin
    (asserts! (is-eq contract-caller .dao) (err ERR-NOT-AUTHORIZED))
    (map-set collateral-types
      { name: collateral-type }
      {
        name: name,
        token: token,
        token-type: collateral-type,
        url: url,
        total-debt: u0,
        liquidation-ratio: liquidation-ratio,
        collateral-to-debt-ratio: collateral-to-debt-ratio,
        maximum-debt: maximum-debt,
        liquidation-penalty: liquidation-penalty,
        stability-fee: stability-fee,
        stability-fee-apy: stability-fee-apy
      }
    )
    (ok true)
  )
)

(define-public (change-risk-parameters (collateral-type (string-ascii 12)) (changes (list 10 (tuple (key (string-ascii 256)) (new-value uint)))))
  (let (
    (type (unwrap-panic (get-collateral-type-by-name collateral-type)))
    (result (fold change-risk-parameter changes type))
  )
    (asserts! (is-eq contract-caller .dao) (err ERR-NOT-AUTHORIZED))

    (map-set collateral-types { name: collateral-type } result)
    (ok true)
  )
)

(define-private (change-risk-parameter (change (tuple (key (string-ascii 256)) (new-value uint)))
                                       (type (tuple (collateral-to-debt-ratio uint) (liquidation-penalty uint) (liquidation-ratio uint)
                                              (maximum-debt uint) (name (string-ascii 256)) (stability-fee uint) (stability-fee-apy uint)
                                              (token (string-ascii 12)) (token-type (string-ascii 12)) (total-debt uint) (url (string-ascii 256)))
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
                type
              )
            )
          )
        )
      )
    )
  )
)

(begin
  (map-set collateral-types
    { name: "STX-A" }
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
    { name: "STX-B" }
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
      stability-fee: u3296, ;; 0.002726155% daily percentage == 1% APY
      stability-fee-apy: u100 ;; 100 basis points
    }
  )
  (map-set collateral-types
    { name: "DIKO-A" }
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
      stability-fee: u3296, ;; 0.002726155% daily percentage == 1% APY
      stability-fee-apy: u100
    }
  )
)
