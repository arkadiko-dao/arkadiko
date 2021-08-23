import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
  name: "governance: add proposal and test proposal data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Get current proposals at start
    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-ids", [], wallet_1.address);
    call.result.expectOk().expectList()[0].expectUint(0);
    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(0)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(false);

    // Create proposal
    let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.uint(10),
        types.utf8("Test Title"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),        
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal(deployer.address),
            'qualified-name': types.principal(Utils.qualifiedName('oracle')),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          })
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // New proposal information 
    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-ids", [], wallet_1.address);
    call.result.expectOk().expectList();

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["title"].expectUtf8("Test Title");
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);
    call.result.expectTuple()["end-block-height"].expectUint(1450); // 10 + 1440

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUint(0);
  }
});

Clarinet.test({
  name: "governance: add proposal with stDIKO balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Stake all DIKO from wallet
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(150000000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(150000);

    // No DIKO left
    let call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUint(0);  

    // Got stDIKO
    call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);  
 
    // Should be able to create poposal
    // No DIKO in wallet, but enough stDIKO
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
      types.uint(10),
      types.utf8("Test Title"),
      types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),        
      types.list([
        types.tuple({
          name: types.ascii("oracle"),
          'address': types.principal(deployer.address),
          'qualified-name': types.principal(Utils.qualifiedName('oracle')),
          'can-mint': types.bool(true),
          'can-burn': types.bool(true)
        })
      ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

  }
});

Clarinet.test({
  name: "governance: vote on proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Create proposal to start at block 1
    let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.uint(1),
        types.utf8("Test Title"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal(deployer.address),
            'qualified-name': types.principal(Utils.qualifiedName('oracle')),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          })
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Should have no votes
    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUint(0);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(10000000)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check votes
    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["yes-votes"].expectUintWithDecimals(10);
    call.result.expectTuple()["no-votes"].expectUint(0);

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(10);

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_2.address)], wallet_2.address);
    call.result.expectTuple()["vote-count"].expectUint(0);

    // Vote for wallet_2
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(20000000)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Vote against wallet_2
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-against", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(1000000)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check votes
    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_2.address);
    call.result.expectTuple()["yes-votes"].expectUintWithDecimals(30);
    call.result.expectTuple()["no-votes"].expectUintWithDecimals(1);

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(10);

    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_2.address)], wallet_2.address);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(21);
  }
});

Clarinet.test({
  name: "governance: end proposal + execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Empty contract change used to fill list
    let emptyContractChangeTuple = types.tuple({
      name: types.ascii(""),
      'address': types.principal(deployer.address),
      'qualified-name': types.principal(deployer.address)
    });
    
    // Create proposal to start at block 1
    let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.uint(1),
        types.utf8("Test Title"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal(deployer.address),
            'qualified-name': types.principal(Utils.qualifiedName('new-oracle')),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          }),
          types.tuple({
            name: types.ascii("freddie"),
            'address': types.principal(deployer.address),
            'qualified-name': types.principal(Utils.qualifiedName('new-freddie')),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          })
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(10000000)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    for (let index = 0; index < 1500; index++) {
      chain.mineBlock([]);
    }

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "end-proposal", [
        types.uint(1)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if proposal updated
    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(false);

    // Check if DAO updated
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal(deployer.address);
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-oracle'));

    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii("freddie")], wallet_2.address);
    call.result.expectSome().expectPrincipal(deployer.address);
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("freddie")], wallet_2.address);
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-freddie'));
  }
});

Clarinet.test({
  name: "governance: end proposal + do not execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Create proposal to start at block 1
    let block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.uint(1),
        types.utf8("Test Title"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal(deployer.address),
            'qualified-name': types.principal(Utils.qualifiedName('new-oracle')),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          })
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Vote for wallet_1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-against", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(10000000)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    for (let index = 0; index < 1500; index++) {
      chain.mineBlock([]);
    }

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "end-proposal", [
        types.uint(1)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if proposal updated
    let call:any = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-proposal-by-id", [types.uint(1)], wallet_1.address);
    call.result.expectTuple()["is-open"].expectBool(false);

    // DAO should not be updated
    call = chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal(deployer.address);
    call = chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii("oracle")], wallet_2.address);
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-oracle-v1-1'));
  }
});

Clarinet.test({
  name: "governance: end proposal + return DIKO and stDIKO to voters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    // Stake DIKO to get stDIKO 
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100); 

    // Advance 3 block, so that DIKO/stDIKO ratio is not 1 anymore
    chain.mineEmptyBlock(3);

    // Stake DIKO to get stDIKO again, at different rate
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
        types.principal(Utils.qualifiedName('arkadiko-stake-registry-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(100000000) // 100
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(24.201384); // 24

    // Total stDIKO balance for user is now ~124
    let call:any = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(124.201384);   

    // Total DIKO balance is 
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149800);  


    // Empty contract change used to fill list
    let emptyContractChangeTuple = types.tuple({
      name: types.ascii(""),
      'address': types.principal(deployer.address),
      'qualified-name': types.principal(deployer.address)
    });
    
    // Create proposal to start at block 1
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.uint(1),
        types.utf8("Test Title"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),        
        types.list([
          types.tuple({
            name: types.ascii("oracle"),
            'address': types.principal(deployer.address),
            'qualified-name': types.principal(Utils.qualifiedName('new-oracle')),
            'can-mint': types.bool(true),
            'can-burn': types.bool(true)
          })
        ])

    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Vote with DIKO
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(10000000) // 10 DIKO
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // DIKO/stDIKO ratio
    call = chain.callReadOnlyFn("arkadiko-stake-pool-diko-v1-1", "diko-stdiko-ratio", [], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(4.131995); // ~4

    // Vote with stDIKO
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('stdiko-token')),
        types.uint(1),
        types.uint(10000000) // 10 stDIKO = ~40 DIKO
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Total votes from wallet: 10 DIKO + 10 stDIKO
    // Where the 10 stDIKO = ~40 DIKO
    // So total is ~50 votes
    call = chain.callReadOnlyFn("arkadiko-governance-v1-1", "get-votes-by-member-by-id", [types.uint(1), types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(51.319950);

    // stDIKO balance
    call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(114.201384);   

    // DIKO balance has decreased by 10
    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149790);  

    // Advance
    for (let index = 0; index < 1500; index++) {
      chain.mineBlock([]);
    }

    // End proposal
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "end-proposal", [
        types.uint(1)
    ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Return DIKO to members
    block = chain.mineBlock([
    Tx.contractCall("arkadiko-governance-v1-1", "return-votes-to-member", [
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.principal(wallet_1.address)
    ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk();

    // Return stDIKO to members
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "return-votes-to-member", [
          types.principal(Utils.qualifiedName('stdiko-token')),
          types.uint(1),
          types.principal(wallet_1.address)
      ], wallet_1.address)
      ]);
      block.receipts[0].result.expectOk();

    // Should have initial amount back
    call = chain.callReadOnlyFn("stdiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(124.201384);   

    call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149800);  

  }
});

Clarinet.test({
  name: "governance: cannot add proposal when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "toggle-governance-shutdown", [], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "propose",
        [
          types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
          types.uint(1),
          types.utf8("Test Title"),
          types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
          types.list([
            types.tuple({
              name: types.ascii("oracle"),
              'address': types.principal(deployer.address),
              'qualified-name': types.principal(Utils.qualifiedName('new-oracle')),
              'can-mint': types.bool(true),
              'can-burn': types.bool(true)
            }),
            types.tuple({
              name: types.ascii("freddie"),
              'address': types.principal(deployer.address),
              'qualified-name': types.principal(Utils.qualifiedName('new-freddie')),
              'can-mint': types.bool(true),
              'can-burn': types.bool(true)
            })
          ])
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(34);
  }
});

Clarinet.test({
  name: "governance: cannot vote for a proposal when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "propose",
        [
          types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
          types.uint(1),
          types.utf8("Test Title"),
          types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
          types.list([
            types.tuple({
              name: types.ascii("oracle"),
              'address': types.principal(deployer.address),
              'qualified-name': types.principal(Utils.qualifiedName('new-oracle')),
              'can-mint': types.bool(true),
              'can-burn': types.bool(true)
            }),
            types.tuple({
              name: types.ascii("freddie"),
              'address': types.principal(deployer.address),
              'qualified-name': types.principal(Utils.qualifiedName('new-freddie')),
              'can-mint': types.bool(true),
              'can-burn': types.bool(true)
            })
          ])
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk();

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "toggle-governance-shutdown", [], deployer.address),
      Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(10000000)
      ], wallet_1.address)
    ]);
    block.receipts[1].result.expectErr().expectUint(34);
  }
});

Clarinet.test({
  name: "governance: add new contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "add-contract-address", [
        types.ascii("amazing-stacker-that-lends"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName('arkadiko-mock-stacker-v1-1')),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "governance: add new contract fails if it already exists",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v1-1", "add-contract-address", [
        types.ascii("stacker"),
        types.principal(deployer.address),
        types.principal(Utils.qualifiedName('arkadiko-mock-stacker-v1-1')),
        types.bool(true),
        types.bool(true)
      ], deployer.address)
    ]);

    block.receipts[0].result.expectOk().expectBool(false);
  }
});
