declare var before: any

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
      await deployContract('arkadiko-mock-ft-trait-v1');
      await deployContract('arkadiko-vault-trait-v1');
      await deployContract('arkadiko-vault-manager-trait-v1');
      await deployContract('arkadiko-dao-token-trait-v1');
      await deployContract('arkadiko-oracle-trait-v1');
      await deployContract('arkadiko-auction-engine-trait-v1');
      await deployContract('arkadiko-collateral-types-trait-v1');
      await deployContract('arkadiko-stacker-trait-v1');
      await deployContract('arkadiko-stake-pool-trait-v1');

      await deployContract('arkadiko-collateral-types-v1-1');
      await deployContract('arkadiko-oracle-v1-1');
      await deployContract('arkadiko-token');
      await deployContract('arkadiko-dao');
      await deployContract('arkadiko-governance-v1-1');
      await deployContract('arkadiko-diko-guardian-v1-1');

      await deployContract('xusd-token');
      await deployContract('xstx-token');

      await deployContract('arkadiko-vault-data-v1-1');
      await deployContract('arkadiko-vault-rewards-v1-1');
      await deployContract('arkadiko-stx-reserve-v1-1');
      await deployContract('arkadiko-sip10-reserve-v1-1');

      await deployContract('arkadiko-stacker-v1-1');
      await deployContract('arkadiko-freddie-v1-1');
      await deployContract('arkadiko-stake-registry-v1-1');
      await deployContract('arkadiko-stake-pool-diko-v1-1');

      await deployContract('arkadiko-auction-engine-v1-1');
      await deployContract('arkadiko-liquidator-v1-1');
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
        contractName: "arkadiko-freddie-v1-1",
        functionName: "get-vault-entries",
        functionArgs: [standardPrincipalCV(alice)],
        senderAddress: contractAddress,
        network: network,
      });
      const arr = cvToJSON(vaultEntries).value.ids.value;
      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
        contractName: "arkadiko-freddie-v1-1",
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
          contractPrincipalCV(deployContractAddress, 'arkadiko-sip10-reserve-v1-1'),
          contractPrincipalCV(deployContractAddress, 'arkadiko-token')
        ]
      );

      const vault = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "arkadiko-freddie-v1-1",
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
