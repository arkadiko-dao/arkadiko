## Audit

### CR-01 Signature Replay in Price Oracle
- Signatures are now stored in a map (buffer to boolean). 
- If a signature is re-used, the transaction will fail.

### HI-01 Update Codebase for Mainnet
- Executed planned modifications for mainnet.

### ME-01 Rewards Lost because of Race Condition
- The `fragments-per-token` variable is only needed to convert a stakers amount into fragments. The reason this conversion was added is so that when USDA is burned, the amount of all stakers can be decreased by updating one variable.
- The rewards logic should not take `fragments-per-token` into account. The rewards are distributed across the total fragments.

### ME-02 Lost Funds due to Fee Front-Running
- Added param `max-mint-fee` to `open-vault` and `update-vault` methods

### ME-03 Authentication via tx-sender
- Switched from using `tx-sender` to `contract-caller`
- Did not change `wstx-token` L55. In this case we do want to compare `sender` param to original `tx-sender` and not with an intermediate contract that handles the transfer.
- Admin related methods use `get-dao-owner` to check if caller is trusted. The `dao-owner` is stored seperately from `dao-guardian` and whitelisted protocol contracts in the `dao` contract.

### MI-01 Panicking on Possible Error
- Replaced unwrap-panic for unwrap!

