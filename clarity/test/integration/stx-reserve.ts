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
  deployContractAddress,
  network,
  secretKey,
  secretDeployKey
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
      await callContractFunction(
        'oracle',
        'update-price',
        secretDeployKey,
        [uintCV(77)]
      );

      const value = 5000000; // equivalent to 5 STX
      console.log('Calling collateralize-and-mint function');
      const result = await callContractFunction(
        'stx-reserve',
        'collateralize-and-mint',
        secretKey,
        [uintCV(value), standardPrincipalCV(alice)]
      );
      console.log(result);
      const vaultEntries = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "stx-reserve",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;
      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "stx-reserve",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(arr[arr.length - 1].value)],
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

      const supply = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "arkadiko-token",
        functionName: "total-supply",
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
      });
      console.log(cvToJSON(supply));
      console.log(cvToJSON(supply).value);
    });

    it("should burn vault with ID u1", async () => {
      console.log('Calling burn function');

      const balanceBefore = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "arkadiko-token",
        functionName: "balance-of",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const balanceValueBefore = cvToJSON(balanceBefore).value.value;
      console.log(balanceValueBefore);

      const result = await callContractFunction(
        'stx-reserve',
        'burn',
        secretKey,
        [uintCV(1), standardPrincipalCV(alice)]
      );
      console.log(result);

      const balanceAfter = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "arkadiko-token",
        functionName: "balance-of",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const balanceValueAfter = cvToJSON(balanceAfter).value.value;
      console.log(balanceValueAfter);

      assert.equal(
        balanceValueBefore,
        balanceValueAfter + 1925000
      );
    });
  });
});
