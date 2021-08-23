import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);

    // Check rewards
    let call:any = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(320)
    
    chain.mineEmptyBlock(1);

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(640)

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "calculate-cumm-reward-per-collateral", [], deployer.address);
    call.result.expectUintWithDecimals(128)

    chain.mineEmptyBlock((6*7*144)-5);

    // Need a write action to update the cumm reward 
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(500000),
        types.uint(100000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], wallet_1.address),
    ]);
    
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "calculate-cumm-reward-per-collateral", [], deployer.address);
    call.result.expectUintWithDecimals(240334.197063)

    // Almost all rewards - 1.2m
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1201670.985315)
  },
});

Clarinet.test({
  name: "vault-rewards: claim DIKO rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);

    chain.mineEmptyBlock(30);

    let call:any = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(890000);   

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(9920)

    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "claim-pending-rewards", [], deployer.address);
    call.result.expectOk().expectUintWithDecimals(9920)

    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(899920);  

  },
});

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards multiple users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);

    // Check rewards
    let call:any = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(320)

    chain.mineEmptyBlock(5);

    // 6 * 320 = 1920
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1920)

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], wallet_1.address),
    ]);

    // Only half of block rewars (320 / 2) = 160
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(160)

    // Already had 1920. 1920 + 160 = 2080
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(2080)

  },
});

Clarinet.test({
  name: "vault-rewards: auto-harvest vault rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(10000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);

    // Check rewards
    let call:any = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(320)

    chain.mineEmptyBlock(5);

    // 6 * 320 = 1920
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(1920)

    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(890000);   

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(500000000), // 500 STX
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], deployer.address)
    ]);

    // Deposit will auto harvest
    // So one block later we are at 320 again
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(319.999815)

    // Rewards have been added to wallet
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(891920);  

  },
});

Clarinet.test({
  name: "vault-rewards: user loses rewards when vault gets liquidated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000),
        types.uint(1000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);

    // Collateral in vault rewards contract
    let call:any = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUintWithDecimals(5);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUint(0);

    // Deposit extra
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "deposit", [
        types.uint(1),
        types.uint(2000000), 
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Collateral in vault rewards contract
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUintWithDecimals(7);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUintWithDecimals(64);

    // Toggle stacking
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "toggle-stacking", [
        types.uint(1)
      ], deployer.address),
      // now vault 1 has revoked stacking, enable vault withdrawals
      Tx.contractCall("arkadiko-stacker-v1-1", "enable-vault-withdrawals", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Withdraw
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-freddie-v1-1", "withdraw", [
        types.uint(1),
        types.uint(1000000), 
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Collateral in vault rewards contract
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUintWithDecimals(6);
    call.result.expectTuple()["cumm-reward-per-collateral"].expectUintWithDecimals(155.428571);

    // Liquidate
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(20),
      ], deployer.address),
      // Notify liquidator
      Tx.contractCall("arkadiko-liquidator-v1-1", "notify-risky-vault", [
        types.principal(Utils.qualifiedName('arkadiko-freddie-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-auction-engine-v1-1')),
        types.uint(1),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(20);
    block.receipts[1].result.expectOk().expectUint(5200);

    // No collateral left
    call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-collateral-of", [types.principal(deployer.address)], deployer.address);
    call.result.expectTuple()["collateral"].expectUint(0);
  },
});

Clarinet.test({
  name: "vault-rewards: vault DIKO rewards over time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      
      Tx.contractCall("arkadiko-oracle-v1-1", "update-price", [
        types.ascii("STX"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
        types.uint(5000000000),
        types.uint(1000000000),
        types.tuple({
          'stack-pox': types.bool(true),
          'auto-payoff': types.bool(true)
        }),
        types.ascii("STX-A"),
        types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
        types.principal(
          Utils.qualifiedName('arkadiko-token'),
        ),
        types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
      ], deployer.address),
    ]);
    block.receipts[1].result.expectOk().expectUintWithDecimals(1000);

    // Check rewards at start
    let call:any = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
    call.result.expectOk().expectUintWithDecimals(320)
    
    // Rewards for 6 weeks = 42 days
    for (let index = 0; index < 50; index++) {

      // Advance 1 day
      chain.mineEmptyBlock(144);

      // Need an action to update cumm reward, otherwise "get-pending-rewards" lacks behind
      block = chain.mineBlock([
        Tx.contractCall("arkadiko-freddie-v1-1", "collateralize-and-mint", [
          types.uint(10000),
          types.uint(1),
          types.tuple({
            'stack-pox': types.bool(true),
            'auto-payoff': types.bool(true)
          }),
          types.ascii("STX-A"),
          types.principal(Utils.qualifiedName('arkadiko-stx-reserve-v1-1')),
          types.principal(
            Utils.qualifiedName('arkadiko-token'),
          ),
          types.principal(Utils.qualifiedName('arkadiko-collateral-types-v1-1')),
          types.principal(Utils.qualifiedName('arkadiko-oracle-v1-1'))
        ], wallet_1.address),
      ]);
      block.receipts[0].result.expectOk().expectUint(1);

      // Get pending rewards
      let call = chain.callReadOnlyFn("arkadiko-vault-rewards-v1-1", "get-pending-rewards", [types.principal(deployer.address)], deployer.address);
      
      // Print total rewards - for docs
      // console.log(call.result.expectOk())

      switch (index)
      {
        case 7: call.result.expectOk().expectUintWithDecimals(363052); break; // 363k
        case 14: call.result.expectOk().expectUintWithDecimals(650622.485); break; // 650k
        case 21: call.result.expectOk().expectUintWithDecimals(912099.195); break; // 912k
        case 28: call.result.expectOk().expectUintWithDecimals(1150063.59); break; // 1.15 mio
        case 35: call.result.expectOk().expectUintWithDecimals(1366573.1); break; // 1.36 mio
        case 42: call.result.expectOk().expectUintWithDecimals(1510462.73); break; // 1.51 mio
        case 49: call.result.expectOk().expectUintWithDecimals(1510462.73); break; // 1.51 mio
        case 56: call.result.expectOk().expectUintWithDecimals(1510462.73); break; // 1.51 mio
        default: break;
      }
    }
  },
});
