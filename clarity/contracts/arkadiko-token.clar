(impl-trait .mock-ft-trait.mock-ft-trait)

;; Defines the Arkadiko Governance Token according to the SRC20 Standard
(define-fungible-token diko)

;; errors
(define-constant err-unauthorized u1)

(define-read-only (get-total-supply)
  (ok (ft-get-supply diko))
)

(define-read-only (get-name)
  (ok "Arkadiko")
)

(define-read-only (get-symbol)
  (ok "DIKO")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance-of (account principal))
  (ok (ft-get-balance diko account))
)

;; TODO - finalize before mainnet deployment
(define-read-only (get-token-uri)
  (ok none)
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (ft-transfer? diko amount sender recipient)
)

;; TODO - finalize before mainnet deployment
(define-public (mint (amount uint) (recipient principal))
  (err err-unauthorized)
)

(define-public (burn (amount uint) (sender principal))
  (ft-burn? diko amount sender)
)

;; Test environments
(begin
  ;; TODO: fix manual mocknet/testnet/mainnet switch
  ;; (if is-in-regtest
  ;;   (if (is-eq (unwrap-panic (get-block-info? header-hash u1)) 0xd2454d24b49126f7f47c986b06960d7f5b70812359084197a200d691e67a002e)
  ;;     (begin ;; Testnet only
  ;;       (try! (ft-mint? diko u1000000000000000 'ST2YP83431YWD9FNWTTDCQX8B3K0NDKPCV3B1R30H)))
  ;;     (begin ;; Other test environments
  ;;       (try! (ft-mint? diko u890000000000 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7))
  ;;       (try! (ft-mint? diko u150000000000 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  ;;       (try! (ft-mint? diko u150000000000 'ST3EQ88S02BXXD0T5ZVT3KW947CRMQ1C6DMQY8H19))
  ;;       (try! (ft-mint? diko u1000000000 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
  ;;     )
  ;;   )
  ;;   true
  ;; )
  (try! (ft-mint? diko u890000000000 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7))
  (try! (ft-mint? diko u150000000000 'ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T))
  (try! (ft-mint? diko u150000000000 'ST3EQ88S02BXXD0T5ZVT3KW947CRMQ1C6DMQY8H19))
  (try! (ft-mint? diko u1000000000 'STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8))
)
