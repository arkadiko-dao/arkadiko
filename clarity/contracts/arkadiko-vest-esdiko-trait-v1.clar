;; @contract Vest esDIKO trait
;; @version 1.0

(define-trait vest-esdiko-trait
  (
    ;; Update staking amount for user
    (update-staking (principal uint) (response bool uint))
  )
)
