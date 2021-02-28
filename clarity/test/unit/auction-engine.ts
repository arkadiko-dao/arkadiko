import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import { assert } from "chai";

describe("auction engine unit test suite", () => {
  let auctionEngineClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    auctionEngineClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.auction-engine", "auction-engine", provider);
  });

  it("should have a valid syntax", async () => {
    await auctionEngineClient.checkContract();
  });

  after(async () => {
    await provider.close();
  });
});
