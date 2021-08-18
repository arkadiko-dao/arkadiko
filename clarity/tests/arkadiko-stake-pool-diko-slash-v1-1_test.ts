import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

Clarinet.test({
name: "diko-slash: execute slash through governance",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  // Add funds to DIKO pool first (100 DIKO)
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-registry-v1-1", "stake", [
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-registry-v1-1'),
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token'),
      types.uint(100000000)
    ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(100000000);

  // Create proposal
  block = chain.mineBlock([
  Tx.contractCall("arkadiko-governance-v1-1", "propose", [
      types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1'),
      types.uint(1),
      types.utf8("Black swan event slash"),
      types.utf8("https://discuss.arkadiko.finance/blackswan1"),
      types.list([
        types.tuple({
          name: types.ascii("diko-slash"),
          'address': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
          'qualified-name': types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-slash-v1-1"),
          'can-mint': types.bool(false),
          'can-burn': types.bool(false)
        })
      ])
  ], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectBool(true);

  // Vote for wallet_1
  block = chain.mineBlock([
  Tx.contractCall("arkadiko-governance-v1-1", "vote-for", [
      types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1"),
      types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-token"),
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

  // Check total DIKO pool balance (as rewards have auto compounded)
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(162639906);

  // Now that the contract is active in the DAO, we can execute it
  // 30% of 162 DIKO = ~48
  block = chain.mineBlock([
  Tx.contractCall("arkadiko-stake-pool-diko-slash-v1-1", "execute", [], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUint(48791971);

  // Foundation (still deployer in this case) should have received the funds
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal(deployer.address)
  ], wallet_1.address);
  call.result.expectOk().expectUint(890048791971);

  // Check total DIKO pool balance
  // 70% of 162 DIKO = ~113
  call = chain.callReadOnlyFn("arkadiko-token", "get-balance", [
    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadiko-stake-pool-diko-v1-1')
  ], wallet_1.address);
  call.result.expectOk().expectUint(113847935);

  // Can not execute slash again
  block = chain.mineBlock([
  Tx.contractCall("arkadiko-stake-pool-diko-slash-v1-1", "execute", [], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(404);
}
});
