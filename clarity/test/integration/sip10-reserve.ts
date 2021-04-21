import {
  callReadOnlyFunction,
  contractPrincipalCV,
  standardPrincipalCV,
  cvToJSON,
  uintCV,
  stringAsciiCV
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

describe("freddie test suite", () => {
  const addresses = [
    "ST3EQ88S02BXXD0T5ZVT3KW947CRMQ1C6DMQY8H19"
  ];
  const alice = addresses[0];

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await deployContract('mock-ft-trait');
      await deployContract('vault-trait');
      await deployContract('vault-manager-trait');
      await deployContract('oracle-trait');
      await deployContract('auction-engine-trait');
      await deployContract('collateral-types-trait');

      await deployContract('collateral-types');
      await deployContract('oracle');
      await deployContract('arkadiko-token');
      await deployContract('mock-pox');
      await deployContract('dao');

      await deployContract('xusd-token');
      await deployContract('xstx-token');

      await deployContract('stx-reserve');
      await deployContract('sip10-reserve');
      await deployContract('freddie');

      await deployContract('stacker-registry');
      await deployContract('auction-engine');
      await deployContract('liquidator');
    });

    it("should mint 5 dollar in stablecoin from 20000000 uDIKO at $2/DIKO through collateralize-and-mint", async () => {
      await callContractFunction(
        'oracle',
        'update-price',
        secretDeployKey,
        [stringAsciiCV('DIKO'), uintCV(200)]
      );

      const value = 20000000; // equivalent to 20 DIKO
      console.log('Calling collateralize-and-mint function');
      const result = await callContractFunction(
        'freddie',
        'collateralize-and-mint',
        secretKey,
        [
          uintCV(value), uintCV(5000000),
          standardPrincipalCV(alice),
          stringAsciiCV('DIKO-A'),
          stringAsciiCV('DIKO'),
          contractPrincipalCV(deployContractAddress, 'sip10-reserve'),
          contractPrincipalCV(deployContractAddress, 'arkadiko-token')
        ]
      );
      console.log(result);
      const vaultEntries = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;
      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(arr[arr.length - 1].value)],
        senderAddress: contractAddress,
        network: network,
      });

      assert.equal(
        cvToJSON(vault).value['debt']['value'].toString(),
        "5000000"
      );
      assert.equal(
        cvToJSON(vault).value['collateral']['value'].toString(),
        "20000000"
      );

      const supply = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "xusd-token",
        functionName: "get-total-supply",
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
      });
      console.log(cvToJSON(supply));
      console.log(cvToJSON(supply).value);
    });

    it("should deposit extra collateral", async () => {
      const value = 20000000; // equivalent to 20 DIKO
      const vaultEntries = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;

      console.log('Calling deposit function');
      const result = await callContractFunction(
        'freddie',
        'deposit',
        secretKey,
        [
          uintCV(arr[arr.length - 1].value),
          uintCV(value),
          contractPrincipalCV(deployContractAddress, 'sip10-reserve'),
          contractPrincipalCV(deployContractAddress, 'arkadiko-token')
        ]
      );

      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(arr[arr.length - 1].value)],
        senderAddress: contractAddress,
        network: network,
      });

      assert.equal(
        cvToJSON(vault).value['debt']['value'].toString(),
        "5000000"
      );
      assert.equal(
        cvToJSON(vault).value['collateral']['value'].toString(),
        "40000000"
      );
    });

    it("should withdraw collateral", async () => {
      const value = 5000000; // equivalent to 5 DIKO
      const vaultEntries = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;

      console.log('Calling withdraw function');
      const result = await callContractFunction(
        'freddie',
        'withdraw',
        secretKey,
        [
          uintCV(arr[arr.length - 1].value),
          uintCV(value),
          contractPrincipalCV(deployContractAddress, 'sip10-reserve'),
          contractPrincipalCV(deployContractAddress, 'arkadiko-token')
        ]
      );

      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(arr[arr.length - 1].value)],
        senderAddress: contractAddress,
        network: network,
      });

      assert.equal(
        cvToJSON(vault).value['debt']['value'].toString(),
        "5000000"
      );
      assert.equal(
        cvToJSON(vault).value['collateral']['value'].toString(),
        "35000000"
      );
    });

    it("should mint xUSD", async () => {
      const value = 1000000; // equivalent to 1 xUSD
      const vaultEntries = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;

      console.log('Calling mint function');
      const result = await callContractFunction(
        'freddie',
        'mint',
        secretKey,
        [
          uintCV(arr[arr.length - 1].value),
          uintCV(value),
          contractPrincipalCV(deployContractAddress, 'sip10-reserve')
        ]
      );

      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(arr[arr.length - 1].value)],
        senderAddress: contractAddress,
        network: network,
      });

      assert.equal(
        cvToJSON(vault).value['debt']['value'].toString(),
        "6000000"
      );
      assert.equal(
        cvToJSON(vault).value['collateral']['value'].toString(),
        "35000000"
      );
    });

    it("should burn xUSD", async () => {
      const value = 1000000; // equivalent to 1 xUSD
      const vaultEntries = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;

      console.log('Calling burn function');
      const result = await callContractFunction(
        'freddie',
        'burn',
        secretKey,
        [
          uintCV(arr[arr.length - 1].value),
          uintCV(6000000),
          contractPrincipalCV(deployContractAddress, 'sip10-reserve'),
          contractPrincipalCV(deployContractAddress, 'arkadiko-token')
        ]
      );

      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "freddie",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(arr[arr.length - 1].value)],
        senderAddress: contractAddress,
        network: network,
      });

      assert.equal(
        cvToJSON(vault).value['debt']['value'].toString(),
        "0"
      );
      assert.equal(
        cvToJSON(vault).value['collateral']['value'].toString(),
        "0"
      );
    });
  });
});
