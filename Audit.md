## Audit

### ME-03 Authentication via tx-sender
- Switched from using `tx-sender` to `contract-caller`
- Did not change `wstx-token` L55. In this case we do want to compare `sender` param to original `tx-sender` and not with an intermediate contract that handles the transfer.
- Admin related methods use `get-dao-owner` to check if caller is trusted. The `dao-owner` is stored seperately from `dao-guardian` and whitelisted protocol contracts in the `dao` contract.

### MI-01 Panicking on Possible Error
- Replaced unwrap-panic for unwrap!

