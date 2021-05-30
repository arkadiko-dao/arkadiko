import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";
import { deployContract, callContractFunction } from "../../../shared/utils";
import {
  uintCV,
  standardPrincipalCV
} from "@stacks/transactions";

describe("xusd token contract test suite", () => {
  let trait: Client;
  let xusdTokenClient: Client;
  let oracleClient: Client;
  let provider: Provider;

  const addresses = [
    "ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T", // wallet_2
    "STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8", // wallet_3
  ];
  const alice = addresses[0];

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    trait = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.mock-ft-trait", "mock-ft-trait", provider);
    xusdTokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.xusd-token", "xusd-token", provider);
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
  });

  it("should have a valid syntax", async () => {
    await trait.deployContract();
    await oracleClient.deployContract();
    await xusdTokenClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await xusdTokenClient.deployContract();
    });

    it("should return total supply of 30", async () => {
      const query = xusdTokenClient.createQuery({ method: { name: "get-total-supply", args: [] } });
      const receipt = await xusdTokenClient.submitQuery(query);
      const result = Result.unwrapUInt(receipt);
      assert.equal(result, 10000000030);
    });

    it("should initialize Alice's balance (20 DIKO)", async () => {
      const query = xusdTokenClient.createQuery({ atChaintip: true, method: { name: "get-balance", args: [`'${alice}`] } });
      const receipt = await xusdTokenClient.submitQuery(query);
      const result = Result.unwrapUInt(receipt);
      assert.equal(result, 20);
    });

    it("should return name", async () => {
      const query = xusdTokenClient.createQuery({
        method: { name: "get-name", args: [] }
      });
      const receipt = await xusdTokenClient.submitQuery(query);
      const result = Result.unwrapString(receipt, "utf8")
      assert.equal(result, "xUSD");
    });

    it("should return symbol", async () => {
      const query = xusdTokenClient.createQuery({
        method: { name: "get-symbol", args: [] }
      });
      const receipt = await xusdTokenClient.submitQuery(query);
      const result = Result.unwrapString(receipt, "utf8")
      assert.equal(result, "xUSD");
    });
  });

  // describe("testing on mocknet", () => {
  //   before(async () => {
  //     await deployContract('xusd-token');
  //   });

  //   it("should mint 5 tokens", async () => {
  //     const value = 5;
  //     console.log('Calling mint function');
  //     const result = await callContractFunction(
  //       'xusd-token',
  //       'mint',
  //       [standardPrincipalCV('ST3CECAKJ4BH08JYY7W53MC81BYDT4YDA5M7S5F53'), uintCV(value)]
  //     );
  //     console.log(result);
  //     assert.equal(true, true);
  //   });
  // });

  after(async () => {
    await provider.close();
  });
});
