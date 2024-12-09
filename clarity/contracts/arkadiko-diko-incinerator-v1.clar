;; @contract DIKO Incinerator - Tokens to be burned from buybacks
;; @version 1

(define-public (burn (amount uint))
  (begin
    (try! (contract-call? .arkadiko-dao burn-token .arkadiko-token amount tx-sender))
    (ok true)
  )
)
