
import {
  Account,
  Chain,
  Clarinet,
  types,
  Tx
} from "https://deno.land/x/clarinet/index.ts";

Clarinet.test({
  name: "Insert vaults into list",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(1),
        types.uint(1),
        types.uint(0),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(3),
        types.uint(3),
        types.uint(0),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(false);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(3),
        types.uint(3),
        types.uint(1),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(2);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(3);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(2),
        types.uint(2),
        types.uint(1),
        types.uint(3),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(3);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(3);

    let call = await chain.callReadOnlyFn("arkadiko-sorted-vaults-v1-1", "get-vault", [
      types.uint(1),
    ], deployer.address);
    call.result.expectSome().expectTuple()["prev-id"].expectNone();
    call.result.expectSome().expectTuple()["next-id"].expectSome().expectUint(2);
    call.result.expectSome().expectTuple()["nicr"].expectUint(1);

    call = await chain.callReadOnlyFn("arkadiko-sorted-vaults-v1-1", "get-vault", [
      types.uint(2),
    ], deployer.address);
    call.result.expectSome().expectTuple()["prev-id"].expectSome().expectUint(1);
    call.result.expectSome().expectTuple()["next-id"].expectSome().expectUint(3);
    call.result.expectSome().expectTuple()["nicr"].expectUint(2);

    call = await chain.callReadOnlyFn("arkadiko-sorted-vaults-v1-1", "get-vault", [
      types.uint(3),
    ], deployer.address);
    call.result.expectSome().expectTuple()["prev-id"].expectSome().expectUint(2);
    call.result.expectSome().expectTuple()["next-id"].expectNone();
    call.result.expectSome().expectTuple()["nicr"].expectUint(3);
  },
});

Clarinet.test({
  name: "Remove vault from list",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(1),
        types.uint(1),
        types.uint(0),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(2),
        types.uint(2),
        types.uint(1),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(3),
        types.uint(3),
        types.uint(2),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "remove", [
        types.uint(2),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(2);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(3);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "remove", [
        types.uint(1),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(3);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(3);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "remove", [
        types.uint(3),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(0);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectNone();
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectNone();
  },
});

Clarinet.test({
  name: "Reinsert vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(1),
        types.uint(1),
        types.uint(0),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(2),
        types.uint(2),
        types.uint(1),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "insert", [
        types.uint(3),
        types.uint(3),
        types.uint(2),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "reinsert", [
        types.uint(2),
        types.uint(4),
        types.uint(3),
        types.uint(0),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(3);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(1);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(2);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-sorted-vaults-v1-1", "reinsert", [
        types.uint(2),
        types.uint(1),
        types.uint(0),
        types.uint(1),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectTuple()["success"].expectBool(true);
    block.receipts[0].result.expectOk().expectTuple()["total-vaults"].expectUint(3);
    block.receipts[0].result.expectOk().expectTuple()["first-vault-id"].expectSome().expectUint(2);
    block.receipts[0].result.expectOk().expectTuple()["last-vault-id"].expectSome().expectUint(3);

  },
});
