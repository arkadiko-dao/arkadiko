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

describe("liquidator test suite", () => {
  const addresses = [
    "ST3EQ88S02BXXD0T5ZVT3KW947CRMQ1C6DMQY8H19"
  ];
  const alice = addresses[0];

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await deployContract('mock-ft-trait');
      await deployContract('vault-trait');

      await deployContract('oracle');
      await deployContract('xusd-token');
      await deployContract('arkadiko-token');
      await deployContract('xstx-token');
      await deployContract('dao');

      await deployContract('stx-reserve');
      await deployContract('sip10-reserve');
      await deployContract('freddie');

      await deployContract('auction-engine');
      await deployContract('liquidator');
    });

    it("liquidates a risky vault", async () => {
      console.log('Calling orcale set-price function to set 1STX = 77 dollarcents');
      await callContractFunction(
        'oracle',
        'update-price',
        secretDeployKey,
        [stringAsciiCV('stx'), uintCV(77)]
      );

      console.log('Calling collateralize-and-mint function');
      await callContractFunction(
        'freddie',
        'collateralize-and-mint',
        secretKey,
        [
          uintCV(5000000), uintCV(1925000),
          standardPrincipalCV(alice),
          stringAsciiCV('stx-a'),
          stringAsciiCV('stx'),
          contractPrincipalCV(deployContractAddress, 'stx-reserve'),
          contractPrincipalCV(deployContractAddress, 'arkadiko-token')
        ]
      );
      
      console.log('Crash price to 55 dollarcents');
      await callContractFunction(
        'oracle',
        'update-price',
        secretDeployKey,
        [stringAsciiCV('stx'), uintCV(55)]
      );

      // now vault is under liquidation ratio
      const result = await callContractFunction(
        'liquidator',
        'notify-risky-vault',
        secretKey,
        [uintCV(1)]
      );
      console.log(result);

      const auctions = await callReadOnlyFunction({
        contractAddress: deployContractAddress,
        contractName: "arkadiko-auction-engine-v1-1",
        functionName: "get-auctions",
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
      });
      const auction = cvToJSON(auctions).value.value[1];

      assert.equal(
        auction.value['collateral-amount']['value'].toString(),
        "5000000"
      );
    });

  });
});
