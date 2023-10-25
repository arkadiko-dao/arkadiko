
# Arkadiko
Arkadiko is a decentralized, non-custodial liquidity protocol on the Stacks network, allowing users to collateralize their assets and mint a stablecoin known as USDA. This empowers depositors to access enhanced liquidity through a soft-pegged US Dollar stablecoin while retaining their initial asset exposure.

Explore our website: [https://www.arkadiko.finance/](https://www.arkadiko.finance/) 
Stay updated with us on Twitter: [https://twitter.com/ArkadikoFinance](https://twitter.com/ArkadikoFinance) 
Access our documentation here: [https://docs.arkadiko.finance](https://docs.arkadiko.finance/)

## USDA
USDA is a soft-pegged stablecoin on the Stacks network. Users can mint USDA by locking collateral in a vault. Since the vaults are always over-collateralized, there is perpetually more value within the system than the outstanding debt in USDA.

## Vaults
Vaults represent a fundamental concept in Arkadiko. When a user establishes a vault, they specify the quantity of collateral tokens to be locked and the amount of USDA debt to be incurred. The collateral and debt for a vault can be adjusted at any time, or the owner can choose to close the vault entirely.

### Fees
The system permits the configuration of a stability fee and/or minting fee. The stability fee is an annual percentage assessed on the outstanding debt and is paid when updating, closing, liquidating, or redeeming a vault. The minting fee is a percentage levied when minting additional USDA.

### Collateral tokens
Each wallet is capable of creating a single vault for each collateral token. Every collateral token is associated with a predefined set of risk parameters:

-   `max-debt` = the maximum total debt allowed in the system.
-   `vault-min-debt` = the minimum debt requirement for a vault.
-   `stability-fee` = the annual stability fee, determined based on the amount of debt.
-   `liquidation-ratio` = the threshold collateral-to-debt ratio, triggering vault liquidation if breached.
-   `liquidation-penalty` = the additional collateral the vault owner will forfeit upon liquidation.
-   `redemption-fee-min` = the minimum redemption fee.
-   `redemption-fee-max` = the maximum redemption fee.
-   `redemption-fee-block-interval` = the number of blocks required for the fee to decay from the maximum to the minimum.
-   `redemption-fee-block-rate` = for every X USDA redeemed, decrease the last block by 1 to increase the fee.

Any SIP-010 token can be included as a collateral token, provided that the token's price is added to the oracle.

### Liquidation
If the collateral-to-debt ratio falls below the liquidation threshold, the vault will undergo liquidation. During this process, USDA from the liquidation pool is employed to settle the vault's debt. In exchange, the liquidation pool acquires collateral tokens equivalent in value to the debt settled, along with additional collateral tokens as a liquidation penalty.

Users have the option to stake USDA in the liquidation pool, and the collateral tokens recovered from liquidations will be distributed proportionally among the stakers. Additionally, continuous DIKO rewards are provided to stakers.

### Redemption
The redemption mechanism provides USDA holders with the option to redeem their USDA at its face value, converting it into the corresponding underlying collateral at any given moment. This process ensures that redemptions are consistently fulfilled, with 1 USDA being equivalent to $1 worth of collateral (excluding the prevailing redemption fee). In essence, redemptions serve to settle the debt of the riskiest vault in exchange for its collateral.

Here's how it works:
-   An individual initiates the redemption of their USDA.
-   All vaults are arranged in ascending order, from those with the lowest collateral ratio (the riskiest) to those with the highest collateral ratio (the least risky).
-   The redeemed USDA is utilized to clear the debt of the riskiest vault, which, in turn, releases its collateral.
-   The remaining collateral in the vault is left for the owner to claim. Importantly, vault owners subject to redemptions do not experience a net loss in the process.

### Sorted list
To facilitate redemptions, it is essential to maintain a well-ordered list of vaults per token on the blockchain. Sorting an unsorted list on-the-fly is impractical, and using a basic list type lacks scalability. This led to the development of a dedicated list contract.

For each list, this contract stores references to the first and last elements, while each list item maintains references to the preceding and succeeding elements. Whenever a new vault is created or an existing one is updated, the vault's position in the sorted list changes and requires immediate adjustment to ensure the accuracy of the sorted list.

Methods responsible for updating the vault's collateral ratio necessitate the inclusion of a `hint` parameter. This parameter denotes the expected position of the vault after the update and references the vault that will precede the updated vault in the list. An off-chain component keeps track of all the vaults within the system, enabling it to calculate the new position during vault updates. Although the `hint` is calculated off-chain, it is cross-verified on-chain to ensure its accuracy, preserving the integrity of the sorted list. 

## DAO
The protocol is overseen by a Decentralized Autonomous Organization (DAO). The community holds the power to initiate and vote on proposals aimed at altering various aspects of the protocol. These proposals can encompass a wide range of actions, including:

-   Incorporating a new collateral token and defining its risk parameters.
-   Adjusting the risk parameters of an already existing collateral token.
-   Determining token emissions.
-   Initiating an emergency shutdown, if necessary.
-   Implementing updates to enhance the protocol's functionality.

### Arkadiko Token
The DIKO governance token functions as voting authority within the DAO, with each token equating to a single vote.

## Stake

### stDIKO
DIKO holders have the opportunity to lock their DIKO tokens in a staking mechanism to earn additional DIKO. Through this staking process, users receive stDIKO, which mirrors the combined amount of staked DIKO tokens along with the rewards from staking. stDIKO can then be utilized for engaging in governance activities.

### LP Tokens
Users who provide liquidity are compensated with DIKO tokens in return for their liquidity contributions. Upon supplying liquidity, the user is granted LP tokens, which can subsequently be staked to cultivate rewards.
