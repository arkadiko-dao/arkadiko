import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  OracleManager,
  WstxToken
} from './models/arkadiko-tests-tokens.ts';

import { 
  VaultsSorted
} from './models/arkadiko-tests-vaults-sorted.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
  name: "vaults-sorted: insert vaults",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let call: any = vaultsSorted.getToken("wstx-token")
    call.result.expectTuple()["first-owner"].expectNone();
    call.result.expectTuple()["last-owner"].expectNone();
    call.result.expectTuple()["total-vaults"].expectUint(0);

    call = vaultsSorted.findPosition(wallet_1.address, "wstx-token", 400000000, wallet_1.address, wallet_1.address)
    // call.result.expectTuple()["neprevxt"].expectNone();
    // call.result.expectTuple()["next"].expectNone();

    let result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 400000000, wallet_1.address, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    // result = vaultsSorted.remove(deployer, wallet_1.address, "wstx-token")
    // result.expectOk().expectTuple()["first-owner"].expectNone();
    // result.expectOk().expectTuple()["last-owner"].expectNone();
    // result.expectOk().expectTuple()["total-vaults"].expectUint(0); 



    result = vaultsSorted.reinsert(deployer, wallet_1.address, "wstx-token", 400000000, wallet_1.address, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  
  },
});
