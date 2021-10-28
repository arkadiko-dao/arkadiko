

(define-public (start)
  (begin
    ;; Increase cumm rewards
    (try! (contract-call? .arkadiko-stake-pool-wstx-usda-v1-1 increase-cumm-reward-per-stake .arkadiko-stake-registry-v1-1))
    (try! (contract-call? .arkadiko-stake-pool-wstx-diko-v1-1 increase-cumm-reward-per-stake .arkadiko-stake-registry-v1-1))
    (try! (contract-call? .arkadiko-stake-pool-diko-usda-v1-1 increase-cumm-reward-per-stake .arkadiko-stake-registry-v1-1))

    ;; Update registry
    (try! (contract-call? .arkadiko-stake-registry-v1-1 set-pool-data .arkadiko-stake-pool-wstx-usda-v1-1 "wSTX-USDA LP" u1 u0 u0))
    (try! (contract-call? .arkadiko-stake-registry-v1-1 set-pool-data .arkadiko-stake-pool-wstx-diko-v1-1 "wSTX-DIKO LP" u1 u0 u0))
    (try! (contract-call? .arkadiko-stake-registry-v1-1 set-pool-data .arkadiko-stake-pool-diko-usda-v1-1 "DIKO-USDA LP" u1 u0 u0))

    (ok true)
  )
)

(start)