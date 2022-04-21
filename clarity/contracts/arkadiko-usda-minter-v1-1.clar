;; The decentralised algorithmic USDA token
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

(define-constant ERR-NOT-AUTHORIZED u40401)
(define-constant ERR-INSUFFICIENT-CAPITAL u40001)
(define-constant ERR-CEILING-REACHED u40002)

(define-data-var supply-ceiling uint u3000000000000) ;; 3M USDA
(define-data-var current-supply uint u0)

(define-public (mint-usda (oracle <oracle-trait>) (amount uint))
  (let (
    (diko-price (unwrap-panic (contract-call? oracle fetch-price "diko")))
    (one-dollar u1000000)
    (amount-to-burn-per-usda (/ (/ (* u100 one-dollar) (get last-price diko-price)) u100)) ;; TODO: fix when DIKO price is > $1
    (amount-to-burn (* amount amount-to-burn-per-usda))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= (+ (var-get current-supply) amount) (var-get supply-ceiling)) (err ERR-CEILING-REACHED))

    (try! (contract-call? .arkadiko-dao burn-token .arkadiko-token amount-to-burn tx-sender))
    (try! (contract-call? .arkadiko-dao mint-token .usda-token amount tx-sender))

    (var-set current-supply (+ (var-get current-supply) amount))
    (ok true)
  )
)

(define-public (burn-usda (oracle <oracle-trait>) (amount uint))
  (let (
    (diko-price (unwrap-panic (contract-call? oracle fetch-price "diko")))
    (one-dollar u1000000)
    (amount-to-mint-per-usda (/ (/ (* u100 one-dollar) (get last-price diko-price)) u100)) ;; TODO: fix when DIKO price is > $1
    (amount-to-mint (* amount amount-to-mint-per-usda))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= (var-get current-supply) amount) (err ERR-INSUFFICIENT-CAPITAL))

    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token amount-to-mint tx-sender))
    (try! (contract-call? .arkadiko-dao burn-token .usda-token amount tx-sender))

    (var-set current-supply (- (var-get current-supply) amount))
    (ok true)
  )
)

(define-public (update-supply-ceiling (ceiling uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set supply-ceiling ceiling))
  )
)
