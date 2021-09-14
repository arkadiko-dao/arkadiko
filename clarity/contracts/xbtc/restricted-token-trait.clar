(define-trait restricted-token-trait
  (
    ;; Called to detect if a transfer restriction will take place.  Returns the
    ;;  error code that explains why the transfer failed.
    (detect-transfer-restriction (uint principal principal) (response uint uint))

    ;; Returns human readable string for a specific transfer restriction error code
    ;;  which is returned from (detect-transfer-restriction).
    ;; This is a convenience function for end user wallets.
    (message-for-restriction (uint) (response (string-ascii 1024) uint))
  )
)
