# Workname Sticky - A Liquid Stacking Protocol on Stacks

### NOTE: This grant outline is a work in progress and a final grant proposal would be iterated upon.

## Background
**What problems do you aim to solve? How does it serve the mission of a user owned internet?**

The Stacks (DeFi) ecosystem is still maturing and does not have a liquid stacking token that can be used in any of the crucial DeFi protocols yet. This project aims to solve the problem of an auto-compounding liquid stacking token (LST) that can be used as collateral that automatically increases in value over time. Establishing an LST on Stacks will allow the ecosystem to grow and encourage more TVL and liquidity to flow in through reusable primitives.

## Project Overview
**What solution are you providing? Who will it serve?**

Sticky implements a liquid stacking token for the Stacks protocol.
A liquid stacking token allows a user to stack their STX tokens with the Proof of Transfer (PoX) consensus mechanism, earning a yield in either STX or (x)(s)BTC, accruing value in the process through multiple PoX stacking cycles.

Users have the option to choose between earning yield in STX or sBTC. This results in two fungible tokens
- stSTX: an LST that compounds STX tokens and stacks the additional STX tokens received
- stbSTX: an LST that earns sBTC yield from stacking the principal STX tokens deposited by a user

A user holding stSTX knows that the value of the token in STX (and hopefully $) will go up over time, since each PoX stacking cycle a certain amount of yield is earned. Such an auto-compounding token should also not incur taxes in certain jurisdictions such as the US (afaik, not financial advice).

The benefits of such a token are clear: it is great to use as collateral, still helps the network security (since the STX are stacked) and improves liquidity across the ecosystem, since now it is both stacking and can be used as a principle in protocols.

Protocols on Stacks DeFi that could benefit from this:

- Arkadiko: mint USDA against stSTX
- ALEX/Bitflow: add a STX/stSTX pool for trading
- Lending: borrow sUSDT against stSTX

Similar benefits can be enjoyed with stbSTX, but less so since it doesn't increase in value necessarily (it accrues sBTC and likely we won't include that as a combined value token without a decentralised oracle).

## Scope
**What are the components or technical specs of the project? What will the final deliverable look like? How will you measure success?**

A high-level architecture currently looks as follows:

![Architecture](https://github.com/philipdesmedt/arkadiko-dao/blob/master/docs/architecture-high-level.png?raw=true)

Components & Technical Specs
- Clarity Contracts. Contains logic to stack, unstack, compound the STX and calculate the amount of STX per stSTX, mint stSTX, burn stSTX, ... is included.
- A react UI will be built on the stacks.js or micro-stacks library hooking into the smart contracts. The initial UI will consist of three big sections:
  - PoX: Overview of past, current and future PoX Stacking Cycle. It's unclear when or whether https://stacking.club/ will come back anytime soon, but I believe the ecosystem needs this app. This project could be a replacement for that (although out of scope for this grant except for some basic data)
  - Stack: choose how much STX you want to stack and how much stSTX you get in return for that (contains the bulk of the logic)
  - DeFi: an overview of all the places where you can leverage stSTX
  - Earn: a page where you can see how much value was distributed to $STICKY token holders (no token in initial version, perhaps out of scope for this grant)
  - Documentation (link to Gitbook)
- Landing Page + Documentation
  - Documentation will be written as a Gitbook page
  - A set of great DeFi landing pages will be used as inspiration, e.g. https://marinade.finance/. The landing page should be very succinct and simple, and acts as the product itself, with a clear call to action to connect your wallet.

### Success Metrics

Success at this stage is measured by transparency of the process. The code and documentation are all open source. At the end of each sprint we hold a review for stakeholders - including an open invitation to community members. The reviews will present the work finished in the sprint and present an opportunity to discuss problems encountered and insights for future development. We will post invitations via direct messages to partners in the Foundation.

Review meetings would likely start in the July/August timeframe as input & feedback becomes more valuable.

The final deliverable will be based on the following user stories. As described above, the final artifact will be a set of smart contracts with a front-end that has great UI/UX.

### User Stories

1. As a user, I can authenticate with the protocol through the Hiro/XVerse Wallet

#### Acceptance Criteria
After successfully authenticating with the Stacks Wallet browser extension, a stateful account exists that can authenticate with Clarity smart contracts.

---

2. As a user or guest, I can view basic information on the landing page, such as APY, total stacking rewards and TVL

#### Acceptance Criteria
All information is accurate and visible to the user

---

3. As a user, I can stack STX and receive stSTX

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- Transfer (`stx-transfer`) the STX tokens into the Sticky reserve smart contract
- the TVL is updated with the new stx amount and stSTX is minted accordingly

---

4. As a user, I can stack STX and receive stbSTX

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- Transfer (`stx-transfer`) the STX tokens into the Sticky reserve smart contract
- the TVL is updated with the new stx amount and stbSTX is minted accordingly

---

5. As a user, I can unstack STX, burning the stSTX and receive all my STX after the current PoX cycle ends

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- Burn the stSTX tokens of the user
- Keep a record of how much was burned until the end of the current PoX cycle (either as an NFT or just on the contract as a value)
- Allow the STX to be withdrawn after the PoX cycle ends

---

6. As a user, I can transfer stbSTX

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- Transfer stbSTX to the new user's principal

---

7. As a user, I can transfer stSTX

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- Transfer stSTX to the new user's principal

---

8. As a stacker, I can look up the TVL, STX/stSTX exchange rate and PoX epoch progress  

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- Call the read-only TVL, ratio and PoX functions to return the data

---

9. As a user or guest, I can view past, current and future PoX cycle information

#### Acceptance Criteria
the Clarity Contract must do the following, atomically:
- It returns PoX information given a certain PoX cycle ID

This will also include a significant amount of front-end (and separate back-end) work as we aim to replace the core functionality of stacking.club, in case it never comes back.

---

10. As a protocol, I can automatically turn BTC into sBTC or STX

#### Acceptance Criteria

This is a feature that will require a lot of R&D, specifically on the feasability.

Developing this feature assumes that it is possible to link a Bitcoin PoX Reward address to some swap mechanism that automatically swaps any incoming BTC on the Bitcoin PoX address into sBTC on the Stacks chain. This assumes that it is technically possible, and that enough liquidity exists on the Stacks side to either swap or peg-in the sBTC. More research will have to be done on whether this is possible at all.

An intermediate solution will be the manual exchange of BTC rewards into STX or sBTC through a swap. This means that the Sticky team has custodial access to the BTC yield until an automated solution can be developed. It is likely that a mainnet v1 will be deployed without this User Story.

---

## Budget & Milestones
**What grant amount are you seeking? How long will the project take in hours? If more than 20, please break down the project into milestones, with a clear output (e.g., low-fi mockup, MVP with two features) and include the estimated work hours for each milestone.**

Development of this project will take hundreds of hours (thousands for a mainnet-ready version). We are seeking a grant amount of 100,000 STX which would cover approximately 80% of our time & expenses made in the next 6 months.


| ID  | User Story     | Days         | Cost         |
| :-: | :------------- | :----------: | -----------: |
| 1   | As a user, I can authenticate with the protocol through the Hiro/Xverse wallet | 3 days  | $3000    |
| 2   | As a user or guest, I can view basic information on the landing page, such as APY, total stacking rewards and TVL   | 5 days | $5000    |
| 3   | As a user, I can stack STX and receive stSTX   | 20 days | $20,000    |
| 4   | As a user, I can stack STX and receive stbSTX   | 15 days | $15,000   |
| 5   | As a user, I can unstack STX, burning the stSTX and receive all my STX after the current PoX cycle ends   | 15 days | $15,000    |
| 6   | As a user, I can transfer stbSTX   | 0.5 day | $500    |
| 7   | As a user, I can transfer stSTX   | 0.5 day | $500    |
| 8   | As a stacker, I can look up the TVL, STX/stSTX exchange rate and PoX epoch progress    | 1 day | $1000    |
| 9   | As a user or guest, I can view past, current and future PoX cycle information  | 15 days | $15000    |
| 10   | As a protocol, I can automatically turn BTC into sBTC or STX  | 40 days | $40,000    |
| | | 115 days | $ 115,000 |

The above includes only core application functionality. I have not included work on setting up a reliable CI pipeline to have automated testing on each build, documentation writing, legal work, audtis etc, which will take the total estimate over $200K. The total time and cost of this project exceeds the scope of the grant, but the grant would deliver significant support to bootstrap the development.

Splitting up the above user stories in a simple yet pragmatic overview, I would propose the following milestones:

1. Milestone 1. Delivery end of August (50,000 STX)

- Main landing page set up
- Working user stories: 1, 2, 3, 4, 6, 7, 8
- Mocknet & local repo cloning.

2. Milestone 2. Delivery end of September (15,000 STX)

- Set up CI pipeline
- First deployment of Testnet version with usable React front-end
- Working user stories: all of the above + 5
- Research on US 10

3. Milestone 3. Delivery end of October (15,000 STX)

- Further deployment of Testnet version
- Working user stories: all of the above + 9
- First Draft of a plan to launch on mainnet
- First documentation

4. Milestone 4. Delivery TBD - dependent on sBTC release (20,000 STX)

- Final version is ready for mainnet (except security audit and liquidity)
- Documentation live
- Security Audit is planned
- US 10 has been researched, feasability has been calculated and technical + liquidity requirements are clear. There is a significant chance this user story will have to be rewritten or done in a different way as automatic conversion is dependent on liquidity and technical constraints that are not clear today. Still we are willing to allocate 20% of the budget here.

Once milestone 4 is reached, all of the risks (see section on Risks) should be derisked. The above timing is an estimate but should be on the conservative side, and thus doable. This is open to feedback or a variation of above milestones if certain things could be delivered more efficiently or in a different manner.

## Team

We have developed and launched Arkadiko in the past, the first DeFi protocol on Stacks. Arkadiko allows users to mint a crypto-collateralised stablecoin (USDA) using STX as collateral, where the STX tokens are stacked in PoX and earning yield.

Having developed and launched this protocol, that gave us critical knowledge about PoX, Clarity and Stacks in general that is needed to develop and launch this.

All of us have 10+ years of experience in startups and tech in general.

## Risks

- Smart contract risk (hacks)
- Liquidity risk (no one wants to use this)
- Centralisation risk (how do you automatically turn BTC into sBTC/STX? Currently impossible as far as we know)

## Future Work (Outside Initial Grant Scope)

- Improving the functionality to further replace stacking.club (unless it comes back - no need to duplicate work or compete with a great app that is already out there)
- Sourcing liquidity to make stSTX ubiquitous
- Working with other DeFi protocols in the ecosystem to have stSTX and stbSTX accepted as collateral/tokens
- Launch a token that is airdropped to the biggest DeFi protocols on Stacks (no private sale) which will earn a revenue share that is taken from the yield (~10%). This incentivises usage of the protocol and helps spread awareness.

## Community and Supporting Materials
**Do you have previous projects, code commits, or experiences that are relevant to this application? What community feedback or input have you received? How do you plan to share your plan to the community over time and as the final deliverable?**

We developed Arkadiko (USDA stablecoin + Swap) and arguably are among the top 10 people who know most about building on top of Proof of Transfer.

During the development of a testnet-ready version, we will provide updates every month or so, with builds that can be tested by the community.

All source code developed under this grant (and the Sticky protocol as an extension) is open-sourced under the GPLv3 license
