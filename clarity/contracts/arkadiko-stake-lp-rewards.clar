;; Arkadiko - Missing LP Staking Rewards 
;; 
;; We had to pause LP staking rewards because of an exploit.
;; Users who provided liquidity and staked LP tokens have missed out on rewards.
;; Via this contract, users can claim missing rewards.
;; 

(define-constant ERR-NOT-AUTHORIZED u80401)
(define-constant ERR-NOTHING-TO-CLAIM u80402)

(define-map wallet-rewards
  { wallet: principal }
  {
    diko: uint
  }
)

(define-read-only (get-diko-by-wallet (wallet principal))
  (default-to
    u0
    (get diko (map-get? wallet-rewards { wallet: wallet }))
  )
)

;; @desc Claim missed out Diko rewards
;; @post boolean; returns true if claim was succesful
(define-public (claim-rewards)
  (let (
    (sender tx-sender)
    (diko-rewards (get-diko-by-wallet sender))
  )
    (asserts! (> diko-rewards u0) (err ERR-NOTHING-TO-CLAIM))

    (try! (as-contract (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-rewards sender)))
  
    (map-set wallet-rewards { wallet: sender } { diko: u0 })
    (ok diko-rewards)
  )
)

;; @desc Claim and stake missed out Diko rewards
;; @post uint; returns amount that is staked
(define-public (stake-rewards)
  (let (
    (sender tx-sender)
    (diko-rewards (get-diko-by-wallet sender))
  )
    (asserts! (> diko-rewards u0) (err ERR-NOTHING-TO-CLAIM))

    (try! (as-contract (contract-call? .arkadiko-dao mint-token .arkadiko-token diko-rewards sender)))
  
    (map-set wallet-rewards { wallet: sender } { diko: u0 })

    (contract-call? .arkadiko-stake-registry-v1-1 stake .arkadiko-stake-registry-v1-1 .arkadiko-stake-pool-diko-v1-1 .arkadiko-token diko-rewards)
  )
)

;; Init

;; TODO - Set final map
(map-set wallet-rewards { wallet: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 } { diko: u100000000 })
