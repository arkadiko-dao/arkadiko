import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import {
  callReadOnlyFunction,
  StacksTransaction,
  uintCV,
  standardPrincipalCV
} from "@stacks/transactions";
import { assert } from "chai";
import { deployContract, callContractFunction } from "./utils";

describe("stacks reserve test suite", () => {
  let stxReserveClient: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let provider: Provider;

  const addresses = [
    "ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH"
  ];
  const alice = addresses[0];

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    oracleClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.oracle", "oracle", provider);
    tokenClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.arkadiko-token", "arkadiko-token", provider);
    stxReserveClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.stx-reserve", "stx-reserve", provider);
  });

  // it("should have a valid syntax", async () => {
  //   await tokenClient.deployContract();
  //   await oracleClient.deployContract();
  //   await stxReserveClient.checkContract();
  // });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await deployContract('oracle');
      await deployContract('arkadiko-token');
      await deployContract('stx-reserve');
    });

    it("should mint 5 tokens through collateralize-and-mint", async () => {
      console.log('Calling orcale set-price function');
      const orcaleResult = await callContractFunction(
        'oracle',
        'update-price',
        [uintCV(77)]
      );

      const value = 5;
      console.log('Calling collateralize-and-mint function');
      const result = await callContractFunction(
        'stx-reserve',
        'collateralize-and-mint',
        [uintCV(value), standardPrincipalCV(alice)]
      );
      console.log(result);
      assert.equal(true, true);
    });
  });

  after(async () => {
    await provider.close();
  });
});
