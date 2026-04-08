# USDA Integration Guide

A comprehensive guide for integrating with Arkadiko Protocol and USDA stablecoin on Stacks.

## Table of Contents

1. [Overview](#overview)
2. [USDA Basics](#usda-basics)
3. [Vault Operations](#vault-operations)
4. [USDA in DeFi](#usda-in-defi)
5. [Liquidation Monitoring](#liquidation-monitoring)
6. [Best Practices](#best-practices)

## Overview

Arkadiko is a decentralized lending protocol that allows users to:

- Mint USDA stablecoins against STX collateral
- Stake DIKO for governance and rewards
- Provide liquidity and earn yields
- Participate in protocol governance

### Contract Addresses

```typescript
const ARKADIKO_CONTRACTS = {
  // Core Protocol
  vault: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-vault-v2-1',
  vaultManager: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-vault-manager-v1-1',
  vaultData: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-vault-data-v1-1',
  
  // Tokens
  usda: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token',
  diko: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-token',
  stdiko: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.stdiko-token',
  
  // Staking
  staking: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stake-pool-v2-1',
  
  // Oracle
  oracle: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-oracle-v2-3',
  
  // Liquidator
  liquidator: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-liquidator-v1-1'
};
```

## USDA Basics

### Get USDA Balance

```typescript
import { callReadOnlyFunction, cvToValue, standardPrincipalCV } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

async function getUSDABalance(address: string): Promise<bigint> {
  const network = new StacksMainnet();
  
  const result = await callReadOnlyFunction({
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'usda-token',
    functionName: 'get-balance',
    functionArgs: [standardPrincipalCV(address)],
    network,
    senderAddress: address
  });

  const value = cvToValue(result);
  return BigInt(value.value || 0);
}

// USDA has 6 decimals
function formatUSDA(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2);
}
```

### Transfer USDA

```typescript
import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  standardPrincipalCV, 
  noneCV,
  PostConditionMode,
  makeStandardFungiblePostCondition,
  FungibleConditionCode
} from '@stacks/transactions';

async function transferUSDA(
  recipient: string,
  amount: bigint,
  senderAddress: string
) {
  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'usda-token',
    functionName: 'transfer',
    functionArgs: [
      uintCV(amount),
      standardPrincipalCV(senderAddress),
      standardPrincipalCV(recipient),
      noneCV() // memo
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardFungiblePostCondition(
        senderAddress,
        FungibleConditionCode.Equal,
        amount,
        'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token::usda'
      )
    ],
    onFinish: (data) => {
      console.log('Transfer TX:', data.txId);
    }
  });
}
```

## Vault Operations

### Get Current STX Price

```typescript
async function getSTXPrice(): Promise<number> {
  const network = new StacksMainnet();
  
  const result = await callReadOnlyFunction({
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-oracle-v2-3',
    functionName: 'get-price',
    functionArgs: [stringAsciiCV('STX')],
    network,
    senderAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR'
  });

  const value = cvToValue(result);
  // Price returned in cents (100 = $1.00)
  return Number(value.value.price) / 100;
}
```

### Create a Vault (Mint USDA)

```typescript
interface CreateVaultParams {
  collateralAmount: bigint; // STX in micro-STX
  usdaAmount: bigint; // USDA to mint
  senderAddress: string;
}

async function createVault(params: CreateVaultParams) {
  // Minimum collateralization ratio is 150%
  const stxPrice = await getSTXPrice();
  const collateralValue = (Number(params.collateralAmount) / 1_000_000) * stxPrice;
  const debtValue = Number(params.usdaAmount) / 1_000_000;
  const ratio = (collateralValue / debtValue) * 100;

  if (ratio < 150) {
    throw new Error(`Collateralization ratio ${ratio.toFixed(0)}% is below minimum 150%`);
  }

  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-vault-v2-1',
    functionName: 'create-vault',
    functionArgs: [
      uintCV(params.collateralAmount),
      uintCV(params.usdaAmount),
      stringAsciiCV('STX-A') // Vault type
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        params.senderAddress,
        FungibleConditionCode.Equal,
        params.collateralAmount
      )
    ],
    onFinish: (data) => {
      console.log('Vault created:', data.txId);
    }
  });
}

// Example: Deposit 1000 STX, mint 300 USDA
createVault({
  collateralAmount: 1_000_000_000n, // 1000 STX
  usdaAmount: 300_000_000n, // 300 USDA
  senderAddress: 'SP...'
});
```

### Get Vault Information

```typescript
interface VaultInfo {
  owner: string;
  collateral: bigint;
  debt: bigint;
  collateralizationRatio: number;
  isLiquidatable: boolean;
  stabilityFee: bigint;
}

async function getVault(vaultId: number): Promise<VaultInfo | null> {
  const network = new StacksMainnet();
  
  const result = await callReadOnlyFunction({
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-vault-data-v1-1',
    functionName: 'get-vault-by-id',
    functionArgs: [uintCV(vaultId)],
    network,
    senderAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR'
  });

  const value = cvToValue(result);
  if (!value) return null;

  const stxPrice = await getSTXPrice();
  const collateralValue = (Number(value.collateral) / 1_000_000) * stxPrice;
  const debtValue = Number(value.debt) / 1_000_000;
  const ratio = debtValue > 0 ? (collateralValue / debtValue) * 100 : 0;

  return {
    owner: value.owner,
    collateral: BigInt(value.collateral),
    debt: BigInt(value.debt),
    collateralizationRatio: ratio,
    isLiquidatable: ratio < 150,
    stabilityFee: BigInt(value['stability-fee'] || 0)
  };
}
```

### Add Collateral

```typescript
async function addCollateral(
  vaultId: number,
  amount: bigint,
  senderAddress: string
) {
  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-vault-v2-1',
    functionName: 'deposit',
    functionArgs: [
      uintCV(vaultId),
      uintCV(amount)
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        senderAddress,
        FungibleConditionCode.Equal,
        amount
      )
    ],
    onFinish: (data) => {
      console.log('Collateral added:', data.txId);
    }
  });
}
```

### Repay USDA Debt

```typescript
async function repayDebt(
  vaultId: number,
  amount: bigint,
  senderAddress: string
) {
  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-vault-v2-1',
    functionName: 'burn',
    functionArgs: [
      uintCV(vaultId),
      uintCV(amount)
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardFungiblePostCondition(
        senderAddress,
        FungibleConditionCode.Equal,
        amount,
        'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token::usda'
      )
    ],
    onFinish: (data) => {
      console.log('Debt repaid:', data.txId);
    }
  });
}
```

### Close Vault

```typescript
async function closeVault(vaultId: number, senderAddress: string) {
  const vault = await getVault(vaultId);
  if (!vault) throw new Error('Vault not found');

  // Must repay all debt + stability fee
  const totalDebt = vault.debt + vault.stabilityFee;

  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-vault-v2-1',
    functionName: 'close-vault',
    functionArgs: [uintCV(vaultId)],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardFungiblePostCondition(
        senderAddress,
        FungibleConditionCode.LessEqual,
        totalDebt,
        'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token::usda'
      )
    ],
    onFinish: (data) => {
      console.log('Vault closed:', data.txId);
    }
  });
}
```

## USDA in DeFi

### Swap USDA on ALEX

```typescript
async function swapUSDAforSTX(
  usdaAmount: bigint,
  minStxOut: bigint,
  senderAddress: string
) {
  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM',
    contractName: 'amm-swap-pool-v1-1',
    functionName: 'swap-helper',
    functionArgs: [
      contractPrincipalCV('SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', 'usda-token'),
      contractPrincipalCV('SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM', 'token-wstx'),
      uintCV(usdaAmount),
      someCV(uintCV(minStxOut))
    ],
    onFinish: (data) => {
      console.log('Swap TX:', data.txId);
    }
  });
}
```

### Provide USDA Liquidity

```typescript
async function addUSDALiquidity(
  usdaAmount: bigint,
  pairedTokenAmount: bigint,
  pairedToken: string,
  senderAddress: string
) {
  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM',
    contractName: 'amm-swap-pool-v1-1',
    functionName: 'add-to-position',
    functionArgs: [
      contractPrincipalCV('SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', 'usda-token'),
      contractPrincipalCV(...pairedToken.split('.')),
      uintCV(usdaAmount),
      someCV(uintCV(pairedTokenAmount))
    ],
    onFinish: (data) => {
      console.log('Liquidity added:', data.txId);
    }
  });
}
```

## Liquidation Monitoring

### Monitor Vaults for Liquidation

```typescript
interface LiquidatableVault {
  id: number;
  owner: string;
  collateral: bigint;
  debt: bigint;
  ratio: number;
}

async function findLiquidatableVaults(): Promise<LiquidatableVault[]> {
  const liquidatable: LiquidatableVault[] = [];
  const stxPrice = await getSTXPrice();
  
  // Fetch recent vaults (would need to iterate in production)
  for (let id = 1; id <= 1000; id++) {
    const vault = await getVault(id);
    if (!vault || vault.debt === 0n) continue;
    
    if (vault.isLiquidatable) {
      liquidatable.push({
        id,
        owner: vault.owner,
        collateral: vault.collateral,
        debt: vault.debt,
        ratio: vault.collateralizationRatio
      });
    }
  }
  
  return liquidatable;
}

// Liquidate a vault
async function liquidateVault(vaultId: number, senderAddress: string) {
  openContractCall({
    network: 'mainnet',
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'arkadiko-liquidator-v1-1',
    functionName: 'liquidate',
    functionArgs: [uintCV(vaultId)],
    onFinish: (data) => {
      console.log('Liquidation TX:', data.txId);
    }
  });
}
```

### Set Up Price Alerts

```typescript
class VaultMonitor {
  private vaultId: number;
  private alertThreshold: number;
  private callback: (vault: VaultInfo) => void;

  constructor(
    vaultId: number,
    alertThreshold: number = 175,
    callback: (vault: VaultInfo) => void
  ) {
    this.vaultId = vaultId;
    this.alertThreshold = alertThreshold;
    this.callback = callback;
  }

  async check() {
    const vault = await getVault(this.vaultId);
    if (!vault) return;

    if (vault.collateralizationRatio < this.alertThreshold) {
      this.callback(vault);
    }
  }

  startMonitoring(intervalMs: number = 60000) {
    return setInterval(() => this.check(), intervalMs);
  }
}

// Usage
const monitor = new VaultMonitor(123, 175, (vault) => {
  console.log(`WARNING: Vault ratio at ${vault.collateralizationRatio.toFixed(0)}%`);
  // Send notification, add collateral, etc.
});

monitor.startMonitoring(30000); // Check every 30 seconds
```

## Best Practices

### 1. Maintain Safe Collateralization

```typescript
// Recommended: Keep ratio above 200%
const SAFE_RATIO = 200;

async function calculateSafeUSDAMint(
  collateralSTX: bigint,
  targetRatio: number = SAFE_RATIO
): Promise<bigint> {
  const stxPrice = await getSTXPrice();
  const collateralValue = (Number(collateralSTX) / 1_000_000) * stxPrice;
  const maxUSDA = (collateralValue / targetRatio) * 100;
  
  return BigInt(Math.floor(maxUSDA * 1_000_000));
}
```

### 2. Monitor Health Factor

```typescript
async function getHealthFactor(vaultId: number): Promise<number> {
  const vault = await getVault(vaultId);
  if (!vault) return 0;
  
  // Health = current ratio / liquidation ratio
  return vault.collateralizationRatio / 150;
}

// Health > 1.0 = safe
// Health < 1.0 = liquidatable
```

### 3. Plan for Price Volatility

```typescript
// Calculate required collateral for worst-case scenario
function calculateWorstCaseCollateral(
  debtUSDA: bigint,
  worstCaseSTXPrice: number,
  targetRatio: number = 200
): bigint {
  const debtValue = Number(debtUSDA) / 1_000_000;
  const requiredCollateralValue = debtValue * (targetRatio / 100);
  const requiredSTX = requiredCollateralValue / worstCaseSTXPrice;
  
  return BigInt(Math.ceil(requiredSTX * 1_000_000));
}
```

## Additional Resources

- [Arkadiko Documentation](https://docs.arkadiko.finance/)
- [Arkadiko App](https://arkadiko.finance/)
- [USDA on CoinGecko](https://www.coingecko.com/en/coins/usda)

---

*This guide is maintained by the community. Contributions welcome!*
