# Stacking STX in Arkadiko

By default, we stack all STX collateral that is used to create vaults.

A few resources that are helpful in understanding pools:
1. How to run a Stacking Pool? https://app.sigle.io/friedger.id/UOvy85BCSD-bjlrv_6q74
2. Friedger Pool implementation: https://explorer.stacks.co/txid/0x9e9e62aa83d06415bb7ba1f5442371da24e04a2fb08193baa8d3ad602353e9a1?chain=mainnet (also see https://gitlab.com/riot.ai/clarity-pool-registry/-/blob/main/contracts/pool-tool.clar)
3. Stacking Contract: https://docs.blockstack.org/references/stacking-contract#introduction

Arkadiko will run a simplified version of a pool. Essentially it won't have to execute `delegate-stack-stx` for each individual user, since all stacks are kept in the smart contract address (i.e. there is only 1 member in the pool).

## Stacking

The minimum amount of STX collateral per vault to be eligible for stacking is 500 STX. By default, all STX vault collateral will be stacked. Yield (earned in bitcoin) will arrive to the reward address that has the same private keys as the contract address that deploys the DAO.

From here on, the DAO will distribute the earned yield as follows:

- Bitcoin can be converted into STX (due to high tx costs)
- The DAO can vote on the distribution of the yield as follows:
  - % that goes to the vault owner
  - % that goes to the DAO reserve (for expenses, emergencies etc)
  - % that goes to the DAO governance token holders

## Liquidations

When a vault gets liquidated, enough STX collateral will need to be auctioned to cover the xUSD debt of the vault. 

When a vault gets liquidated during the stacking cycle, the vault owner will not be eligible to get the yield of the part of the STX collateral that had to be auctioned off. By default, the yield of the current stacking cycle of the liquidated collateral will be distributed as follows:

- from the auctioned collateral: a % that goes to the winner of each lot in the auction (min 500 STX)
- from the auctioned collateral: a % that goes to the DAO reserve
- from the leftover collateral: % that goes to the vault owner, DAO and governance tokens as described by the DAO parameters

Since STX tokens can be stacked at the time of the auction and thus won't be liquid, Arikadiko will auction a STX derivative called STX futures. The incentive to buy the STX futures are the additional yield that comes with the lot. Once the stacking cycle ends and STX is unlocked, the STX Futures owner can exchange their tokens for real STX.

STX Futures tokens will be burned as soon as they are exchanged for real STX. If the total Arkadiko supply of STX futures tokens is zero, it means no STX tokens are owed to lot winners. As STX Futures spread in the ecosystem, these might be exchanged at other liquidity providers (e.g. exchanges, p2p) as well.
