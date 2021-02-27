# ArkadikoDAO

ArkadikoDAO is a DAO inspired by MakerDAO and implements a stablecoin called Arkadiko ($DIKO) and a Governance Token called Somos ($ARE).

In order to mint $DIKO, you need to over-collateralise Stacks ($STX) tokens into the Arkadiko Stacks Reserve. The collateralisation ratio will be defined by a risk parameter decided upon by the community.

Collateralised Stacks tokens can be used to stack in the Proof-of-Transfer (PoX) mechanism and get rewards in bitcoin for locking up tokens for a certain time. This will only be possible from the moment `min_amount_ustx` amount of tokens are collateralised (see https://stacks-node-api.blockstack.org/v2/pox) in the Arkadiko Stacks Reserve. At the time of writing, the minimum amount of $STX to participate in stacking is 70,000 $STX tokens. This mechanism will incentivize $DIKO holders to keep and trade stablecoins, and at the same time earn Bitcoin on their stablecoins in a decentralised way (through the $STX collateral).

All bitcoin earned will go into a bitcoin reserve, where a percentage is paid out to $ARE owners once the reserve goes over a certain threshold. This threshold is voted on by the community.

## Architecture

A high-level architecture would look as follows:

![Architecture](https://github.com/philipdesmedt/arkadiko-dao/blob/master/architecture-high-level.png?raw=true)


## Diko: Arkadiko Stablecoin

Whenever new $DIKO is minted, debt (as collateral) is created in the network. With every type of collateral (in principal only $STX will be accepted as collateral), a set of Risk parameters will be decided on by the community. These parameters can be voted on through the $ARE governance token. A total of 100,000 $ARE tokens will ever exist. Each token has 1 vote.

### Stablecoin Risk Parameters

- Debt​ ​Ceiling:​ A Debt Ceiling is the maximum amount of debt that can be created by a single collateral type. Arkadiko Governance assigns every collateral type a Debt Ceiling, which is used to ensure sufficient diversification of the Arkadiko Protocol collateral portfolio. Once a collateral type has reached its Debt Ceiling, it becomes impossible to create more debt unless some existing users pay back all or a portion of their Reserve debt.

- Stability​ ​Fee:​ The Stability Fee is an annual percentage yield calculated on top of how much $DIKO has been generated against a Reserve's collateral. The fee is paid in $STX, and then sent into the Arkadiko Buffer.

- Liquidation​ ​Ratio:​ ​A low Liquidation Ratio means Arkadiko Governance expects low price volatility of the collateral; a high Liquidation Ratio means high volatility is expected.

- Liquidation Penalty:​ The Liquidation Penalty is a fee added to a Reserve's total outstanding generated $DIKO when a Liquidation occurs. The Liquidation Penalty is used to encourage $DIKO owners to keep appropriate collateral levels.


## Somos: Arkadiko Governance Token

The $ARE governance token is used to manage and vote on proposals put forward by the community.

- Add a​ ​new​ ​collateral asset ​type with a unique set of Risk Parameters.
- (TODO) Change the Risk Parameters of one or more existing collateral asset types, or add new Risk Parameters to one or more existing collateral asset types.
- (TODO) Modify​ ​the $ARE Savings Rate.
- (TODO) Choose the set of Oracle Feeds.
- (TODO) Choose the set of Emergency Oracles.
- (TODO) Trigger Emergency Shutdown.
- (TODO) Upgrade the system.
- (TODO) Set the percentage threshold to distribute BTC earnings


## Roadmap

[x] Add STX reserve to collateralize STX and mint $DIKO
[ ] Back-end that updates price feed oracle once per minute
[ ] Ability for Stackers to buy up liquidated STX collateral
[ ] Front-end with Blockstack account & wallet integration
[ ] Liquidation Engine

[ ] v2 - Auction Engine
[ ] v2 - Stack collateralized $STX to earn BTC
[ ] v2 - Option to choose to stack collateral or not
[ ] v2 - Somos DAO with token
[ ] v2 - Decentralize Oracle (Chainlink integration?)
[ ] v2 - Stability Fees in $STX
