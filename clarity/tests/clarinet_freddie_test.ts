import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.3.0/index.ts';
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Returns the correct name of the Arkadiko Token",
  async fn(chain: Chain, accounts: Array<Account>) {
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-token", "name", [], accounts[0].address)
    ]);
    assertEquals(block.height, 2);
    assertEquals(block.receipts[0].result, '(ok "Arkadiko")');
  }
});
