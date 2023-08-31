;; @contract Collateral Types trait 
;; @version 1

(define-trait collateral-types-trait
  (
    (get-collateral-type-by-name ((string-ascii 12)) (response (tuple (name (string-ascii 256)) (token (string-ascii 12)) (token-type (string-ascii 12)) (token-address principal) (url (string-ascii 256)) (total-debt uint) (liquidation-ratio uint) (collateral-to-debt-ratio uint) (maximum-debt uint) (liquidation-penalty uint) (stability-fee uint) (stability-fee-decimals uint) (stability-fee-apy uint)) bool))
    (get-collateral-to-debt-ratio ((string-ascii 12)) (response uint bool))
    (get-maximum-debt ((string-ascii 12)) (response uint bool))
    (get-liquidation-penalty ((string-ascii 12)) (response uint bool))
    (get-liquidation-ratio ((string-ascii 12)) (response uint bool))
    (get-token-address ((string-ascii 12)) (response principal bool))
    (get-total-debt ((string-ascii 12)) (response uint bool))

    (add-debt-to-collateral-type ((string-ascii 12) uint) (response uint uint))
    (subtract-debt-from-collateral-type ((string-ascii 12) uint) (response uint uint))
  )
)
