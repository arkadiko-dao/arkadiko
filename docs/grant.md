# ArkadikoDAO

## Background
**What problems do you aim to solve? How does it serve the mission of a user owned internet?**

The Stacks (DeFi) ecosystem is quite new and does not have any of the crucial DeFi primitives or liquidity protocols yet. This project aims to solve the problem of liquidity and market-making through a stablecoin. Establishing stablecoin standards on Stacks will grow the ecosystem and encourage stability. It serves the mission of a user owned internet since it allows users to maintain price stability on their assets and earn a yield at the same time, without having to go through rigorous KYC/AML requirements. Additionally, having the ability for STX holders to market make, and put their crypto to work, provides even more opportunities for value creation and passive income.

## Project Overview
**What solution are you providing? Who will it serve?**

Disclaimer: the name of the project and tokens are subject to change.

Arkadiko implements a stablecoin called Arkadiko (DIKO) and a Governance Token called Somos (ARE) that create the foundational primitives for a lending/borrowing platform.

The Arkadiko protocol trustlessly provides stable loans backed by Stacks Tokens (STX), known as Arkadiko (DIKO). In order to mint DIKO, you need to over-collateralise Stacks (STX) tokens into an Arkadiko Stacks Vault. In other words, DIKO is a stablecoin, existing to maintain relative price stability in volatile markets. People repay their loans by returning DIKO plus a little more to cover the fixed interest on the loan (called the stability fee). The protocol enforces the price by selling off a person's STX if its total value falls below 150 percent (liquidation ratio) of how ever much STX the user borrowed. All STX will be sold through auctions to stackers who are registered with the protocol.

No more and no less DIKO exist in the world than loans made in it at that time. Every single DIKO is some piece of someone’s STX, locked up on the Arkadiko protocol until the person who put in their STX pays the DIKO back. When DIKO goes into the system to repay a loan, it just gets burnt and disappears forever. Only the interest (i.e. stability fee) remains for Arkadiko to use to reward ARE holders or cover expenses for the protocol.

When STX are posted as collateral to mint stablecoins, the STX tokens will automatically be used to stack natively on the Stacks protocol (either autonomously or through a delegation pool). The yield earned in bitcoin will be used for three purposes:
1. Reward DIKO stablecoin minters to HODL and use their stablecoins (e.g. they take 80% of the yield)
2. Go into the reserve of the DAO to cover expenses (e.g. the reserve takes 5% of the yield)
3. Distribute earnings among the ARE governance token holders (e.g. the token holders get 15% of the yield)

All numbers and parameters will eventually be voted and decided upon through the DAO (Decentralised Autonomous Organisation), where each ARE token counts towards one vote. The following parameters can be decided upon (this list is not comprehensive and can expand as DAO development progresses):

1. Risk Parameters for STX collateral
  - Liquidation Ratio
  - Collateral to Debt Ratio
  - Maximum Debt
  - Liquidation Penalty
2. Yield distribution of STX Stacking Reward

As an example, in v1 of Arkadiko, users will be able to mint stablecoins through collateralizing STX. The following risk parameters are used for STX:

- Liquidation Ratio: 150
- Collateral to Debt Ratio: 200
- Maximum Debt: $100 million
- Liquidation Penalty: 13%

These parameters are subject to change.

### Stablecoin Risk Parameters

- Maximum Debt:​ A Debt Ceiling is the maximum amount of debt that can be created by a single collateral type. Arkadiko Governance assigns every collateral type a Debt Ceiling, which is used to ensure sufficient diversification of the Arkadiko Protocol collateral portfolio. Today, only one type of collateral is accepted (STX) but this will change as soon as more (SRC20) tokens get accepted by the community. Once a collateral type has reached its Debt Ceiling, it becomes impossible to create more debt unless some existing users pay back all their Vault debt (and thus burns their DIKO).

- Stability​ ​Fee:​ The Stability Fee is an annual percentage yield calculated on top of how much DIKO has been generated against a Reserve's collateral. The fee is paid in STX, and then sent into the Arkadiko Buffer.

- Collateral to Debt Ratio: Indicates how much collateral needs to be posted to create an amount of debt. A collateral to debt of 200 means that two times as much collateral needs to be posted as the amount minted (e.g. $10 stablecoin needs $20 STX collateral).

- Liquidation​ ​Ratio:​ ​A low Liquidation Ratio means Arkadiko Governance expects low price volatility of the collateral; a high Liquidation Ratio means high volatility is expected.

- Liquidation Penalty:​ The Liquidation Penalty is a fee added to a Vault's total outstanding generated DIKO when a Liquidation occurs. The Liquidation Penalty is used to encourage DIKO owners to keep appropriate collateral levels.

The DAO will eventually be supported by a foundation, where the foundation will initiate a governance token sale for those interested. The amount of ARE governance tokens has yet to be decided, and can be subject to low inflation that is fixed in the protocol. The token supply & distribution will be laid out in the coming months. Ultimately, Arkadiko wants to position itself as a community-led growth and development vehicle.

### Somos: Arkadiko Governance

The ARE governance token is used to manage and vote on proposals put forward by the community.

- Add a​ ​new​ ​collateral asset ​type with a unique set of Risk Parameters.
- Change the Risk Parameters of one or more existing collateral asset types
- Set the percentage threshold to distribute BTC earnings
- Trigger Emergency Shutdown

## Scope
**What are the components or technical specs of the project? What will the final deliverable look like? How will you measure success?**

A high-level architecture currently looks as follows:
![Architecture](https://github.com/philipdesmedt/arkadiko-dao/blob/master/docs/architecture-high-level.png?raw=true)

Components & Technical Specs
- A set of around 15 Clarity smart contracts will be built. Some are already built but need to be iterated upon. Those that are already built need to be more secure with smart contract asserts, post conditions, and some need to become more flexible + battle tested. E.g. in the initial version, it was not possible for a user to have multiple vaults. In a recent effort, I made it possible for users to have multiple vaults.
- A react UI will be built on the Stacks.js library hooking into the smart contracts. The initial UI will consist of three big sections:
  - Creating Vaults, Minting & Burning
  - Auctioning of Liquidated Vaults
  - Voting and other DAO functions
- I will work with a designer who can improve UI & UX
- Until a production-ready Oracle is available, I will have to build out a mechanism that reliably updates the price feed oracle through a simple cron job

A functional v0.1 can be tested at https://github.com/philipdesmedt/arkadiko-dao. It requires running mocknet.

### Success Metrics

Success at this stage is measured by transparency of our process. The code and documentation are all open source. Furthermore, at the end of each sprint we hold a review for stakeholders - including an open invitation to community members. The reviews will present the work finished in the sprint and present an opportunity to discuss problems encountered and insights for future development. We will post invitations to our reviews on Discord and via direct messages to partners in the Foundation.

Review meetings would likely start in the May - June timeframe as input & feedback becomes more valuable.

### User Stories

1. As a user, I can authenticate with the protocol through the Stacks Wallet Browser Extension or similar

#### Acceptance Criteria

TODO

2. As a user, I can create a vault that mints stablecoin and takes STX as collateral

#### Acceptance Criteria

TODO

- As a user, I can update my vault to post additional STX collateral to avoid liquidation

#### Acceptance Criteria

TODO

- As a user, I can destroy a vault to burn the stablecoins, and return me the STX collateral minus the stability fee

#### Acceptance Criteria

TODO

- As a user, I can burn a partial stablecoin position

#### Acceptance Criteria

TODO

- As a user, I can register to become a stacker and help liquidate risky positions

#### Acceptance Criteria

TODO

- As a user, I can transfer DIKO and it automatically updates the vault (and its collateral) to the new owner

#### Acceptance Criteria

TODO

- As a stacker, I can lookup the collateral to debt ratio of vaults and identify risky ones

#### Acceptance Criteria

TODO

- As a stacker, I can alert the liquidator for risky vaults

#### Acceptance Criteria

TODO

- As a user, I can vote on risk parameters with a governance token

#### Acceptance Criteria

TODO

- As a user, I can submit a proposal if I hold at least 1% of the governance token supply

#### Acceptance Criteria

TODO

- As a user, I can vote on proposals (FOR or AGAINST)

#### Acceptance Criteria

TODO

- As a user, I am eligible for stacked bitcoin yield relative to the amount of governance tokens I hold

#### Acceptance Criteria

TODO


## Budget & Milestones
**What grant amount are you seeking? How long will the project take in hours? If more than 20, please break down the project into milestones, with a clear output (e.g., low-fi mockup, MVP with two features) and include the estimated work hours for each milestone.**

TODO

## Team

Currently I am working on this alone. In the last 7 years, I have successfully built and sold a SaaS company as the founding CTO. I built a team of ~20 devs and set up security efforts, served as lead architect, helped design the product lifecycle, raised money, led technical due diligence during the acquisition, liaised with customers and shareholders etc. I've seen most aspects of the business, which makes me qualified to build & launch the first version of Arkadiko, including initial go-to-market and follow-up.

When the first version is ready to launch on mainnet and most risks (see below) are resolved, it is likely that a Swiss foundation will be set up to lead Arkadiko in the beginning years.

## Usage

- Trading Liquidity
- Enables stacking with a tradeable derivative (e.g. allows trading a productive asset that yields btc while the STX are locked up)
- Lending & Borrowing liquidity milestone to build out Arkadiko Lending & Borrowing Platform which will support a multitude of assets (and SRC20 tokens)
- Any application that wants to make use of stable prices & liquidity (e.g. games)

## Risks

- I am the sole developer on this right now. Having said that, I have built high performing teams in the past and have people close to me with (technical or operational) knowledge of cryptocurrency & DeFi. They are willing to join, but I prefer building the foundations of Arkadiko first to de-risk and make it easier to delegate certain tasks and future work.
- This is a big effort. I am a successful developer, CTO and entrepreneur, but it the amount of work and complexity cannot be underestimated. Due to professional reasons, I cannot go full-time on this until July/August, but I will be then.
- The Stacks Ecosystem as a whole is young. I am missing certain primitives that would block Arkadiko from launching on mainnet:
  - An SRC20 token standard
  - Decentralised Oracle support (e.g. Chainlink)
  - Stacks Wallet Chrome Extension which is still alpha
  - Probably need another stablecoin (e.g. USDT, USDC, PAX) on Stacks to peg against at some point
- The Discord community is still small (but active) so getting questions answered & debugging can take slightly longer
- One `tx-sender` address can only stack once at the moment, as far as I'm aware. This would make stacking inefficient. I believe this will be fixed mid to long term on the Stacks stacking protocol, and a SIP is already open AFAIK (on https://github.com/stacksgov/sips/issues).

Apart from the above, there is a set of more generic risks (e.g. protocol risk wrt security, economic risks if you decide to buy the governance token, regulatory risk that needs to be resolved etc).

## Future Work (Outside Initial Grant Scope)

- Once the stablecoin and DAO are live on mainnet, the next step would be to turn this into a real DeFi hub by building out a liquidity borrowing/lending protocol (i.e. similar to Aave or Compound on ETH). I do think if/when the stablecoin and DAO generate traction, this next step would be easier due to extra resources & having derisked above items
- Collateralize multiple types of cryptocurrency (e.g. wrapped bitcoin or even a 2-of-2 multisig bitcoin that does not need to leave the base bitcoin layer)

## Community and Supporting Materials
Do you have previous projects, code commits, or experiences that are relevant to this application? What community feedback or input have you received? How do you plan to share your plan to the community over time and as the final deliverable?

I initially submitted a very early version of Arkadiko to the Stacks 2.0 Mainnet Clarity Smart Contract Challenge where it was chosen as one of the winners. I have received positive feedback from the community on the project, which is also one of the drivers & motivators to make this real on mainnet.

During the development of a testnet-ready version, I will provide updates every 3 weeks, with canary builds that can be tested by the community. Furthermore, it would be amazing if the grant would allow access to a group of dedicated testers who want to make a difference by testing early versions, and through office hours with tech & business experts on certain subjects.
