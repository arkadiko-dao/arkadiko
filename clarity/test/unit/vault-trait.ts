import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import { assert } from "chai";

describe("vault trait unit test suite", () => {
  let vaultTraitClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    vaultTraitClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.vault-trait", "vault-trait", provider);
  });

  it("should have a valid syntax", async () => {
    await vaultTraitClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
