import {
  callReadOnlyFunction,
  standardPrincipalCV,
  cvToJSON,
  uintCV
} from "@stacks/transactions";
import { assert } from "chai";
import {
  deployContract,
  callContractFunction,
  contractAddress,
  network,
} from "../../../shared/utils";

describe("stacks reserve test suite", () => {
  const addresses = [
    "ST2ZRX0K27GW0SP3GJCEMHD95TQGJMKB7G9Y0X1MH"
  ];
  const alice = addresses[0];

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await deployContract('vault-trait');
      await deployContract('oracle');
      await deployContract('arkadiko-token');
      await deployContract('stx-reserve');
    });

    it("should mint 1.925 dollar in stablecoin from 5000000 ustx at 77 cents/STX through collateralize-and-mint", async () => {
      console.log('Calling orcale set-price function to set 1STX = 77 dollarcents');
      const orcaleResult = await callContractFunction(
        'oracle',
        'update-price',
        [uintCV(77)]
      );

      const value = 5000000; // equivalent to 5 STX
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
        cvToJSON(vault).value['coins-minted']['value'].toString(),
        "1925000"
      );
      assert.equal(
        cvToJSON(vault).value['stx-collateral']['value'].toString(),
        "5000000"
      );
    });
  });
});
