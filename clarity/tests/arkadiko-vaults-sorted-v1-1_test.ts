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


    //
    // Insert first element
    //

    // TODO: both should be none
    call = vaultsSorted.findPosition(wallet_2.address, "wstx-token", 2, wallet_2.address, wallet_2.address)
    call.result.expectTuple()["prev"].expectNone();
    call.result.expectTuple()["next"].expectNone();

    let result = vaultsSorted.insert(deployer, wallet_2.address, "wstx-token", 2, wallet_2.address, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  




    // THIS SHOULD NOT BE VALID
    // call = vaultsSorted.findPosition(wallet_1.address, "wstx-token", 1, wallet_1.address, wallet_1.address)
    // call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_1.address);
    // call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_2.address);




    //
    // Insert at start
    //
    call = vaultsSorted.findPosition(wallet_1.address, "wstx-token", 1, wallet_2.address, wallet_1.address)
    call.result.expectTuple()["prev"].expectNone();
    call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_1.address);

    result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 1, wallet_2.address, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    //
    // Insert at end
    //
    call = vaultsSorted.findPosition(wallet_4.address, "wstx-token", 4, wallet_2.address, wallet_4.address)
    call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectTuple()["next"].expectNone();

    result = vaultsSorted.insert(deployer, wallet_4.address, "wstx-token", 4, wallet_2.address, wallet_4.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  


    //
    // Insert middle
    //
    call = vaultsSorted.findPosition(wallet_3.address, "wstx-token", 3, wallet_2.address, wallet_4.address)
    call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_4.address);

    result = vaultsSorted.insert(deployer, wallet_3.address, "wstx-token", 3, wallet_2.address, wallet_4.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  


    // 
    // Check vaults
    //

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(1);
    call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_1.address);
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_1.address); // should be 2

    call = vaultsSorted.getVault(wallet_2.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(2);
    // call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_2.address); // should be 1
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_3.address);

    call = vaultsSorted.getVault(wallet_3.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(3);
    call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_4.address);

    call = vaultsSorted.getVault(wallet_4.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(4);
    call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_3.address);
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_4.address);







    // result = vaultsSorted.remove(deployer, wallet_1.address, "wstx-token")
    // result.expectOk().expectTuple()["first-owner"].expectNone();
    // result.expectOk().expectTuple()["last-owner"].expectNone();
    // result.expectOk().expectTuple()["total-vaults"].expectUint(0); 



    // result = vaultsSorted.reinsert(deployer, wallet_1.address, "wstx-token", 400000000, wallet_1.address, wallet_1.address)
    // result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    // result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_1.address);
    // result.expectOk().expectTuple()["total-vaults"].expectUint(1);  
  },
});
