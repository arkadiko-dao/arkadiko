# Arkadiko
https://www.arkadiko.finance/

Arkadiko implements a stablecoin soft-pegged to 1 USD called xUSD and a Governance Token DIKO that create the foundational primitives for a lending/borrowing platform.

The Arkadiko protocol trustlessly provides stable loans backed by Stacks Tokens (STX), known as xUSD. In order to mint xUSD, you need to over-collateralise Stacks (STX) tokens into an Arkadiko Stacks Vault. In other words, xUSD is a stablecoin, existing to maintain relative price stability in volatile markets. People repay their loans by returning xUSD plus a little more to cover the fixed interest on the loan (called the stability fee). The loan can be paid back anytime, as there is no repayment schedule. The protocol enforces the price by selling off a person's STX if its total value falls below 150 percent (liquidation ratio) of how ever much STX the user borrowed. All STX will be sold through auctions to stackers who are registered with the protocol.

No more and no less xUSD exist in the world than loans made in it at that time. Every single xUSD is some piece of someone’s STX, locked up on the Arkadiko protocol until the person who put in their STX pays the xUSD back. When xUSD goes into the system to repay a loan, it just gets burnt and disappears forever. Only the interest (i.e. stability fee) remains for Arkadiko to use to reward DIKO holders or cover expenses for the protocol.

When STX are posted as collateral to mint stablecoins, the STX tokens will automatically be used to stack natively on the Stacks protocol (either autonomously or through a delegation pool). The yield earned in bitcoin will be used for three purposes:

1. Reward xUSD stablecoin minters to HODL and use their stablecoins (e.g. they take 80% of the yield)
2. Go into the reserve of the DAO to cover expenses (e.g. the reserve takes 5% of the yield)
3. Distribute earnings among the DIKO governance token holders (e.g. the token holders get 15% of the yield)

All yields, numbers and parameters will eventually be voted and decided upon through the DAO (Decentralised Autonomous Organisation), where each DIKO token counts towards one vote.

## Architecture

A high-level architecture would look as follows:

![Architecture](https://github.com/philipdesmedt/arkadiko-dao/blob/master/docs/architecture-high-level.png?raw=true)


## xUSD: Arkadiko Stablecoin

Whenever new xUSD is minted, debt (as collateral) is created in the network. With every type of collateral (in principal only $STX will be accepted as collateral), a set of Risk parameters will be decided on by the community. These parameters can be voted on through the DIKO governance token. Each token has 1 vote.

### Stablecoin Risk Parameters

- Debt​ ​Ceiling:​ A Debt Ceiling is the maximum amount of debt that can be created by a single collateral type. Arkadiko Governance assigns every collateral type a Debt Ceiling, which is used to ensure sufficient diversification of the Arkadiko Protocol collateral portfolio. Once a collateral type has reached its Debt Ceiling, it becomes impossible to create more debt unless some existing users pay back all or a portion of their Reserve debt.

- Stability​ ​Fee:​ The Stability Fee is an annual percentage yield calculated on top of how much xUSD has been generated against a Reserve's collateral. The fee is paid in $STX, and then sent into the Arkadiko Buffer.

- Liquidation​ ​Ratio:​ ​A low Liquidation Ratio means Arkadiko Governance expects low price volatility of the collateral; a high Liquidation Ratio means high volatility is expected.

- Liquidation Penalty:​ The Liquidation Penalty is a fee added to a Reserve's total outstanding generated xUSD when a Liquidation occurs. The Liquidation Penalty is used to encourage xUSD owners to keep appropriate collateral levels.


## Arkadiko Governance Token

The DIKO governance token is used to manage and vote on proposals put forward by the community.

- Add a​ ​new​ ​collateral asset ​type with a unique set of Risk Parameters.
- Change the Risk Parameters of one or more existing collateral asset types
- Set the percentage threshold to distribute BTC earnings
- Trigger Emergency Shutdown
- Regulate Stacks stacking & payouts

## Roadmap

A public Trello roadmap will be published soon

## Tests and Mocking

Tests are present in the `test` folder (using `mocha` in TypeScript) and some very early test in the `tests` folder which uses Clarinet (a Clarity build tool). The mocha tests can be ran easily like this: `npm test clarity/test/integration/liquidator.ts`.

Some of the smart contracts (such as PoX and fungible token trait) are mocked contracts/traits. These should not be deployed to mainnet when a production-ready version is ready to be deployed.

## Error Handling

All errors thrown by the smart contracts are unsigned integers. The format used is the following <SMART_CONTRACT_PREFIX><ERROR_CODE>, where the smart contract prefix is denoted as follows:

1 - arkadiko-token
2 - auction-engine
3 - dao
4 - freddie
5 - liquidator
6 - mock-ft-trait
8 - oracle
9 - sip10-reserve
11 - stx-reserve
12 - vault-trait
13 - xstx-token
14 - xusd-token
15 - stdiko-token
16 - diko-staker
17 - collateral-types
19 - stacker
