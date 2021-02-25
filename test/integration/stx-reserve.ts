import { Client, Provider, ProviderRegistry, Result, Transaction } from "@blockstack/clarity";
import {
  callReadOnlyFunction,
  StacksTransaction,
  uintCV,
  standardPrincipalCV,
  cvToString,
} from "@stacks/transactions";
import { assert } from "chai";
import {
  deployContract,
  callContractFunction,
  contractAddress,
  network,
} from "../utils";

describe("stacks reserve test suite", () => {
  let stxReserveClient: Client;
  let oracleClient: Client;
  let tokenClient: Client;
  let provider: Provider;

  const addresses = [
    "ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH"
  ];
  const alice = addresses[0];

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
      const vault = await callReadOnlyFunction({
        contractAddress: contractAddress,
        contractName: "stx-reserve",
        functionName: "get-vault",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      assert.equal(
        cvToString(vault),
        "(tuple (coins-minted u1) (stx-collateral u5))"
      );
    });
  });
});
