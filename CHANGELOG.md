## Version 0.8.0

- Rename all smart contracts to use an `arkadiko-` prefix and a major-minor version postfix (e.g. `v1-1`). Smart contracts that never change don't have a version postfix. Traits only have a major version, since the whole (part of the) protocol changes when traits change.
- Mint DIKO tokens for the foundation and founders, vested over 4 years time.
- Add DIKO rewards for people who provide STX liquidity through vaults in the first 6 weeks of mainnet launch
- Add 50 million DIKO staking rewards, distributed over 5 years time, with 25 million DIKO staking rewards in the first year
- Implement better UI validations for staking and creating vaults

## Version 0.7.0

- Add stacking logic to pay out vaults that have STX collateral. If a vault gets liquidated during a stacking cycle, the vault owner will not be eligible for the yield. The yield will be paid out to the winners of the auctions.

## Version 0.6.1

### New features

- Allow on-chain governance proposal voting with DIKO or stDIKO
- Claim back tokens after proposal ends

## Version 0.6.0

### New features

- Add staking pools and registry. Currently a DIKO staking pool is implemented, which gives DIKO rewards for staking, with the option to add staking for other fungible tokens in the future (e.g. a DIKO LP token or even stablecoins).

## Version 0.5.0

### New features

- Allow contract versioning through trait implementations. The current smart contracts have a trait definition:
  - Auction Engine
  - Collateral Types
  - Liquidator
  - Oracle
  - Staking (WIP)
  - Vault Manager (Freddie)

## Version 0.4.0

### New features

- When the amount of collateral in a normal collateral liquidation auction does not cover the xUSD debt, a debt auction will be started afterwards. A debt auction sells governance tokens from the Arkadiko pool to cover bad debt in the system.

## Version 0.3.1

### New features

- Implement DAO kill switch (emergency shutdown) to disable vault actions

## Version 0.3.0

### New Features

- Improve auction logic by selling lots of 100 xUSD

## Version 0.2.0

### New Features

- When STX collateral is stacked in PoX and a vault needs to be liquidated, an equivalent amount of xSTX tokens will be minted that are interchangeable for STX once they get unlocked from PoX. Instead of STX, the xSTX tokens will be auctioned off. Owning the xSTX will also make you eligible to get the rewards from PoX for the corresponding STX tokens.

## Version 0.1.7

### Bug Fixes

- Fix burning xUSD debt after running auction
- Show only one lot for sale in an auction at once

## Version 0.1.6

### New Features

- Allow partial withdrawal of collateral from a vault
- Allow minting xUSD without hitting the maximum collateralization ratio
- Burn partial debt, or all debt to close a vault

## Version 0.1.5

### New Features

- Do not allow minting xUSD if maximum debt of a collateral type is reached

## Version 0.1.4

### New Features

- Node.js script that queries all vaults, identifies the risky ones and liquidates them

## Version 0.1.3

### New Features

- Split up auction in lots of 100 xUSD instead of 100 STX

### Bug Fixes

- Fix auctioning off multiple collateral types

## Version 0.1.2

### New Features

- Calculate stability fees weekly and show them in UI
- Pay back stability fees

## Version 0.1.1

### Bug fixes

- Fix minting extra debt (xUSD) based on the correct collateral type

## Version 0.1.0

### New features

- Authenticate with Arkadiko through Stacks Web Wallet extension
- Add 3 collateral types: STX-A, STX-B and DIKO
- Add SIP10 reserve to allow creation of vaults with multiple collateral types
- Mint extra xUSD to use excess collateral
- Deposit extra collateral to protect a risky vault
- Withdraw extra collateral when collateralization ratio is healthy
- Pay back all debt in vault

### Minor Changes

- Upgraded and refactored `@stacks/connect` and `@stacks/connect-react` usage

### Bug fixes

- Fix manage vault pages to load correct data
