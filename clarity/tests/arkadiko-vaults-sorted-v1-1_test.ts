import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

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
    let wallet_5 = accounts.get("wallet_5")!;
    let wallet_6 = accounts.get("wallet_6")!;
    let wallet_7 = accounts.get("wallet_7")!;
    let wallet_8 = accounts.get("wallet_8")!;
    let wallet_9 = accounts.get("wallet_9")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let call: any = vaultsSorted.getToken("wstx-token")
    call.result.expectOk().expectTuple()["first-owner"].expectNone();
    call.result.expectOk().expectTuple()["last-owner"].expectNone();
    call.result.expectOk().expectTuple()["total-vaults"].expectUint(0);


    //
    // Insert first element
    //
    call = vaultsSorted.checkPosition(wallet_2.address, "wstx-token", 20, wallet_2.address);
    call.result.expectTuple()["correct"].expectBool(true);
    call.result.expectTuple()["first"].expectBool(true);
    call.result.expectTuple()["last"].expectBool(true);
    call.result.expectTuple()["prev"].expectNone();
    call.result.expectTuple()["next"].expectNone();

    call = vaultsSorted.findPosition(wallet_2.address, "wstx-token", 20, wallet_2.address)
    call.result.expectTuple()["prev"].expectNone();
    call.result.expectTuple()["next"].expectNone();

    let result = vaultsSorted.insert(deployer, wallet_2.address, "wstx-token", 20, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  


    //
    // Insert at start
    //
    call = vaultsSorted.checkPosition(wallet_1.address, "wstx-token", 10, wallet_2.address);
    call.result.expectTuple()["correct"].expectBool(true);
    call.result.expectTuple()["first"].expectBool(true);
    call.result.expectTuple()["last"].expectBool(false);
    call.result.expectTuple()["prev"].expectNone();
    call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_2.address);

    call = vaultsSorted.findPosition(wallet_1.address, "wstx-token", 10, wallet_2.address)
    call.result.expectTuple()["prev"].expectNone();
    call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_2.address);

    result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 10, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    //
    // Insert at end
    //
    call = vaultsSorted.checkPosition(wallet_4.address, "wstx-token", 40, wallet_2.address);
    call.result.expectTuple()["correct"].expectBool(true);
    call.result.expectTuple()["first"].expectBool(false);
    call.result.expectTuple()["last"].expectBool(true);
    call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectTuple()["next"].expectNone();

    call = vaultsSorted.findPosition(wallet_4.address, "wstx-token", 40, wallet_2.address)
    call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectTuple()["next"].expectNone();

    result = vaultsSorted.insert(deployer, wallet_4.address, "wstx-token", 40, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  


    //
    // Insert middle
    //
    call = vaultsSorted.checkPosition(wallet_3.address, "wstx-token", 30, wallet_2.address);
    call.result.expectTuple()["correct"].expectBool(true);
    call.result.expectTuple()["first"].expectBool(false);
    call.result.expectTuple()["last"].expectBool(false);
    call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_4.address);

    call = vaultsSorted.findPosition(wallet_3.address, "wstx-token", 30, wallet_2.address)
    call.result.expectTuple()["prev"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectTuple()["next"].expectSome().expectPrincipal(wallet_4.address);

    result = vaultsSorted.insert(deployer, wallet_3.address, "wstx-token", 30, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  


    // 
    // Check vaults
    //

    call = vaultsSorted.getVault(wallet_1.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(10);
    call.result.expectSome().expectTuple()["prev-owner"].expectNone();
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_2.address);

    call = vaultsSorted.getVault(wallet_2.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(20);
    call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_1.address);
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_3.address);

    call = vaultsSorted.getVault(wallet_3.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(30);
    call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_2.address);
    call.result.expectSome().expectTuple()["next-owner"].expectSome().expectPrincipal(wallet_4.address);

    call = vaultsSorted.getVault(wallet_4.address, "wstx-token");
    call.result.expectSome().expectTuple()["nicr"].expectUint(40);
    call.result.expectSome().expectTuple()["prev-owner"].expectSome().expectPrincipal(wallet_3.address);
    call.result.expectSome().expectTuple()["next-owner"].expectNone();


    // 
    // Insert more
    //

    // Insert near end, but give first as hint
    result = vaultsSorted.insert(deployer, wallet_5.address, "wstx-token", 36, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(5);  

    // Insert near beginning, but give last as hint
    result = vaultsSorted.insert(deployer, wallet_6.address, "wstx-token", 12, wallet_4.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(6);  

    // Insert near end, but give first as hint
    result = vaultsSorted.insert(deployer, wallet_7.address, "wstx-token", 38, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(7);  

    // Insert near beginning, but give one of last as hint
    result = vaultsSorted.insert(deployer, wallet_8.address, "wstx-token", 11, wallet_5.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(8);  

    // Insert near end, but give first as hint
    result = vaultsSorted.insert(deployer, wallet_9.address, "wstx-token", 37, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(9);  
  },
});

Clarinet.test({
  name: "vaults-sorted: remove vaults",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 10, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.insert(deployer, wallet_2.address, "wstx-token", 20, wallet_2.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    result = vaultsSorted.insert(deployer, wallet_3.address, "wstx-token", 30, wallet_2.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  

    result = vaultsSorted.insert(deployer, wallet_4.address, "wstx-token", 40, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  

    // Remove first
    result = vaultsSorted.remove(deployer, wallet_1.address, "wstx-token");
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  

    // Remove middle
    result = vaultsSorted.remove(deployer, wallet_3.address, "wstx-token");
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    // Remove last
    result = vaultsSorted.remove(deployer, wallet_4.address, "wstx-token");
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    // Remove all
    result = vaultsSorted.remove(deployer, wallet_2.address, "wstx-token");
    result.expectOk().expectTuple()["first-owner"].expectNone();
    result.expectOk().expectTuple()["last-owner"].expectNone();
    result.expectOk().expectTuple()["total-vaults"].expectUint(0);  
  },
});

Clarinet.test({
  name: "vaults-sorted: remove vaults",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 10, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.insert(deployer, wallet_2.address, "wstx-token", 20, wallet_2.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    result = vaultsSorted.insert(deployer, wallet_3.address, "wstx-token", 30, wallet_2.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  

    result = vaultsSorted.insert(deployer, wallet_4.address, "wstx-token", 40, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  

    // Reinsert first
    result = vaultsSorted.reinsert(deployer, wallet_3.address, "wstx-token", 5, wallet_1.address);
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_3.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  

    // Reinsert last
    result = vaultsSorted.reinsert(deployer, wallet_3.address, "wstx-token", 50, wallet_1.address);
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_3.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  

    // Reinsert middle
    result = vaultsSorted.reinsert(deployer, wallet_3.address, "wstx-token", 15, wallet_1.address);
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(wallet_4.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  
  },
});

// ---------------------------------------------------------
// Same NICR
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-sorted: insert owners with same nicr",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(deployer, deployer.address, "wstx-token", 1, deployer.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 1, wallet_1.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_1.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    result = vaultsSorted.insert(deployer, wallet_2.address, "wstx-token", 1, wallet_2.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(wallet_2.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  
  },
});

// ---------------------------------------------------------
// Errors
// ---------------------------------------------------------

Clarinet.test({
  name: "vaults-sorted: insert same vault again",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(deployer, deployer.address, "wstx-token", 1, deployer.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.insert(deployer, deployer.address, "wstx-token", 2, deployer.address)
    result.expectErr().expectUint(960002)
  },
});

Clarinet.test({
  name: "vaults-sorted: reinsert or remove vault that does not exist",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.reinsert(deployer, deployer.address, "wstx-token", 10, deployer.address);
    result.expectErr().expectUint(960003)

    result = vaultsSorted.remove(deployer, deployer.address, "wstx-token");
    result.expectErr().expectUint(960003)
  },
});

Clarinet.test({
  name: "vaults-sorted: wrong hint",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;
    let wallet_5 = accounts.get("wallet_5")!;
    let wallet_6 = accounts.get("wallet_6")!;
    let wallet_7 = accounts.get("wallet_7")!;
    let wallet_8 = accounts.get("wallet_8")!;
    let wallet_9 = accounts.get("wallet_9")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(deployer, wallet_1.address, "wstx-token", 10, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.insert(deployer, wallet_2.address, "wstx-token", 20, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(2);  

    result = vaultsSorted.insert(deployer, wallet_3.address, "wstx-token", 30, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(3);  

    result = vaultsSorted.insert(deployer, wallet_4.address, "wstx-token", 40, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(4);  

    result = vaultsSorted.insert(deployer, wallet_5.address, "wstx-token", 50, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(5);  

    result = vaultsSorted.insert(deployer, wallet_6.address, "wstx-token", 60, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(6);  

    result = vaultsSorted.insert(deployer, wallet_7.address, "wstx-token", 70, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(7);  

    result = vaultsSorted.insert(deployer, wallet_8.address, "wstx-token", 80, wallet_1.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(8);  

    result = vaultsSorted.insert(deployer, wallet_9.address, "wstx-token", 75, wallet_1.address)
    result.expectErr().expectUint(960001);  
  },
});

Clarinet.test({
  name: "vaults-sorted: insert same vault again",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(deployer, deployer.address, "wstx-token", 1, deployer.address)
    result.expectOk().expectTuple()["first-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["last-owner"].expectSome().expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.insert(deployer, deployer.address, "wstx-token", 2, deployer.address)
    result.expectErr().expectUint(960002)
  },
});

Clarinet.test({
  name: "vaults-sorted: not authorised to insert, reinsert or remove",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let vaultsSorted = new VaultsSorted(chain, deployer);

    let result = vaultsSorted.insert(wallet_1, deployer.address, "wstx-token", 1, deployer.address)
    result.expectErr().expectUint(960401)

    result = vaultsSorted.insert(deployer, deployer.address, "wstx-token", 1, deployer.address)
    result.expectOk().expectTuple()["total-vaults"].expectUint(1);  

    result = vaultsSorted.reinsert(wallet_1, deployer.address, "wstx-token", 10, deployer.address);
    result.expectErr().expectUint(960401)

    result = vaultsSorted.remove(wallet_1, deployer.address, "wstx-token");
    result.expectErr().expectUint(960401)
  },
});
