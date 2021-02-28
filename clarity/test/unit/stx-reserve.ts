import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import { assert } from "chai";

describe("stacks reserve test suite", () => {
  let vaultTrait: Client;
  let stxReserveClient: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    vaultTrait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    stxReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
  });

  it("should have a valid syntax", async () => {
    await vaultTrait.deployContract();
    await tokenClient.deployContract();
    await oracleClient.deployContract();
    await stxReserveClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
