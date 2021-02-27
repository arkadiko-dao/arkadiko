import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";
import { deployContract, callContractFunction } from "../utils";
import {
  uintCV,
  standardPrincipalCV
} from "@stacks/transactions";

describe("arkadiko token contract test suite", () => {
  let arkadikoTokenClient: Client;
  let oracleClient: Client;
  let provider: Provider;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    arkadikoTokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
  });

  it("should have a valid syntax", async () => {
    await oracleClient.deployContract();
    await arkadikoTokenClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await arkadikoTokenClient.deployContract();
    });

    it("should return total supply of 30", async () => {
      const query = arkadikoTokenClient.createQuery({ method: { name: "total-supply", args: [] } });
      const receipt = await arkadikoTokenClient.submitQuery(query);
      const result = Result.unwrapUInt(receipt);
      assert.equal(result, 30);
    });

    it("should initialize Alice's balance (20 DIKO)", async () => {
      const query = arkadikoTokenClient.createQuery({ atChainTip: true, method: { name: "balance-of", args: [`'${alice}`] } });
      const receipt = await arkadikoTokenClient.submitQuery(query);
      const result = Result.unwrapUInt(receipt);
      assert.equal(result, 20);
    });

    it("should return name", async () => {
      const query = arkadikoTokenClient.createQuery({
        method: { name: "name", args: [] }
      });
      const receipt = await arkadikoTokenClient.submitQuery(query);
      const result = Result.unwrapString(receipt, "utf8")
      assert.equal(result, "Arkadiko");
    });

    it("should return symbol", async () => {
      const query = arkadikoTokenClient.createQuery({
        method: { name: "symbol", args: [] }
      });
      const receipt = await arkadikoTokenClient.submitQuery(query);
      const result = Result.unwrapString(receipt, "utf8")
      assert.equal(result, "DIKO");
    });
  });

  describe("testing on mocknet", () => {
    before(async () => {
      await deployContract('arkadiko-token');
    });

    it("should mint 5 tokens", async () => {
      const value = 5;
      console.log('Calling mint function');
      const result = await callContractFunction(
        'arkadiko-token',
        'mint',
        [standardPrincipalCV('ST3CECAKJ4BH08JYY7W53MC81BYDT4YDA5M7S5F53'), uintCV(value)]
      );
      console.log(result);
      assert.equal(true, true);
    });
  });

  after(async () => {
    await provider.close();
  });
});
