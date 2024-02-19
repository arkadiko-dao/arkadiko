import {
  Account,
  Chain,
  Clarinet
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
name: "diko-guardian: print staking distribution",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Use to print rewards per step
  // console.log("---------------");
  // for (let step = 0; step < 8*26; step++) {
  //   let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  //   console.log(call.result);
  //   chain.mineEmptyBlock(2016);
  // }
  // console.log("---------------");
}
});

Clarinet.test({
name: "diko-guardian: staking rewards distribution",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;

  // Get rewards at start
  let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(626.399062)

  // Get rewards after 13 steps
  chain.mineEmptyBlock(2016 * 13);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(469.799297)

  // Get rewards after 1 year
  chain.mineEmptyBlock(2016 * 13);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(313.199530)

  // Get rewards after 2 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(156.599765)

  // Get rewards after 3 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(78.299882)

    // Get rewards after 4 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(39.149941)

  // Get rewards after 5 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(28)

  // Get rewards after 6 years
  chain.mineEmptyBlock(2016 * 26);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(28)

  // Get rewards after 10 years
  chain.mineEmptyBlock(2016 * 26 * 4);
  call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
  call.result.expectUintWithDecimals(28)

}
});


Clarinet.test({
  name: "diko-guardian: print staking distribution",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    // Use to print rewards per step
    // console.log("---------------");
    // for (let step = 0; step < 8*26; step++) {
    //   let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
    //   console.log(call.result);
    //   chain.mineEmptyBlock(2016);
    // }
    // console.log("---------------");
  }
  });
  
  Clarinet.test({
  name: "diko-guardian: rewards per bitcoin and stacks block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
  
    chain.mineEmptyBlock(2000);

    let call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-block", [], wallet_1.address);
    call.result.expectUintWithDecimals(626.399062)

    call = chain.callReadOnlyFn("arkadiko-diko-guardian-v2-1", "get-staking-rewards-per-stacks-block", [], wallet_1.address);
    call.result.expectUintWithDecimals(160)
  
    // Get rewards after 1 year
    chain.mineEmptyBlock(2016 * 13);

  }
  });
