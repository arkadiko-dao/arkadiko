;; The decentralised algorithmic USDA token
(use-trait oracle-trait .arkadiko-oracle-trait-v1.oracle-trait)

(define-constant ERR-NOT-AUTHORIZED u40401)
(define-constant ERR-INSUFFICIENT-CAPITAL u40001)
(define-constant ERR-CEILING-REACHED u40002)

(define-constant ONE-DOLLAR u1000000)
(define-data-var supply-ceiling uint u3000000000000) ;; 3M USDA
(define-data-var current-supply uint u0)

;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Read-only functions  ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;
(define-read-only (get-supply-ceiling)
  (var-get supply-ceiling)
)

(define-read-only (get-current-supply)
  (var-get current-supply)
)

(define-public (diko-per-dollar (oracle <oracle-trait>))
  (let (
    (diko-price (unwrap-panic (contract-call? oracle fetch-price "DIKO")))
    (amount-per-dollar (/ (* u1000000 ONE-DOLLAR) (get last-price diko-price)))
  )
    (ok amount-per-dollar)
  )
)

;;;;;;;;;;;;;;;;;;;;;;
;; Public functions ;;
;;;;;;;;;;;;;;;;;;;;;;
(define-public (mint-usda (oracle <oracle-trait>) (amount uint))
  (let (
    (amount-to-burn (/ (* amount (unwrap-panic (diko-per-dollar oracle))) u1000000))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= (+ (var-get current-supply) amount) (var-get supply-ceiling)) (err ERR-CEILING-REACHED))

    (try! (contract-call? .arkadiko-dao burn-token .arkadiko-token amount-to-burn tx-sender))
    (try! (contract-call? .arkadiko-dao mint-token .usda-token amount tx-sender))

    (var-set current-supply (+ (var-get current-supply) amount))
    (ok amount-to-burn)
  )
)

(define-public (burn-usda (oracle <oracle-trait>) (amount uint))
  (let (
    (amount-to-mint (/ (* amount (unwrap-panic (diko-per-dollar oracle))) u1000000))
  )
    (asserts! (is-eq (contract-of oracle) (unwrap-panic (contract-call? .arkadiko-dao get-qualified-name-by-name "oracle"))) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= (var-get current-supply) amount) (err ERR-INSUFFICIENT-CAPITAL))

    (try! (contract-call? .arkadiko-dao mint-token .arkadiko-token amount-to-mint tx-sender))
    (try! (contract-call? .arkadiko-dao burn-token .usda-token amount tx-sender))

    (var-set current-supply (- (var-get current-supply) amount))
    (ok amount-to-mint)
  )
)


;;;;;;;;;;;;;;;;;;;;;;
;; Admin functions  ;;
;;;;;;;;;;;;;;;;;;;;;;
(define-public (update-supply-ceiling (ceiling uint))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .arkadiko-dao get-dao-owner)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set supply-ceiling ceiling))
  )
)
