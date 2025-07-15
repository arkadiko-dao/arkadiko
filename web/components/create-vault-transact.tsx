import React, { useContext, useEffect } from 'react';
import { stacksNetwork as network } from '@common/utils';
import {
  Cl,
  Pc,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';
import { atAlexContractAddress, stStxContractAddress, resolveReserveName, tokenTraits, calculateMintFee } from '@common/vault-utils';
import { AppContext } from '@common/context';
import { Alert } from './ui/alert';
import { makeContractCall } from '@common/contract-call';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [state, setState] = useContext(AppContext);
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const sbtcContractAddress = process.env.SBTC_CONTRACT_ADDRESS || '';

  const callCollateralizeAndMint = async () => {
    const decimals = coinAmounts['token-name'].toLowerCase().includes('stx') ? 1000000 : 100000000;
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const tokenAddress = tokenTraits[coinAmounts['token-name'].toLowerCase()]['address'];
    const collateralAmount = parseInt(coinAmounts['amounts']['collateral'] * decimals, 10);
    const debtAmount = parseInt(coinAmounts['amounts']['usda'], 10) * 1000000;
    const amount = Cl.uint(collateralAmount);

    const BASE_URL = process.env.HINT_API_URL;
    const url = BASE_URL + `?owner=${address}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${debtAmount}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);
    const mintFee = await calculateMintFee(debtAmount);

    const args = [
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-tokens-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-data-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-sorted-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-pool-active-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-helpers-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-oracle-v3-1'
      ),
      Cl.contractPrincipal(tokenAddress, token),
      amount,
      Cl.uint(debtAmount),
      Cl.some(Cl.standardPrincipal(hint['prevOwner'])),
      Cl.uint(parseInt(mintFee, 10))
    ];

    let postConditions: any[] = [];
    if (coinAmounts['token-name'].toLowerCase() === 'stx') {
      postConditions = [
        Pc.principal(address!).willSendEq(amount.value).ustx(),
        {
          type: "ft-postcondition",
          address: stxAddress,
          condition: "lte", // 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
          amount: amount.value,
          asset: `${process.env.REACT_APP_CONTRACT_ADDRESS}.wstx-token::wstx`,
        },
      ];
    } else if (coinAmounts['token-name'].toLowerCase() === 'ststx') {
      postConditions = [
        {
          type: "ft-postcondition",
          address: address,
          condition: "lte", // 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
          amount: amount.value,
          asset: `${stStxContractAddress}.ststx-token::ststx`,
        },
      ];
    } else if (coinAmounts['token-name'].toLowerCase() === 'sbtc') {
      postConditions = [
        {
          type: "ft-postcondition",
          address: address,
          condition: "lte", // 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
          amount: amount.value,
          asset: `${sbtcContractAddress}.sbtc-token::sbtc-token`,
        },
      ];
    }

    await makeContractCall(
      {
        stxAddress: address,
        contractName: 'arkadiko-vaults-operations-v1-3',
        contractAddress: contractAddress,
        functionName: 'open-vault',
        functionArgs: args,
        postConditions,
        network,
      },
      async (error?, txId?) => {
        setState(prevState => ({
          ...prevState,
          currentTxId: txId,
          currentTxStatus: 'creating vault...',
        }));
      }
    );
  };

  useEffect(() => {
    callCollateralizeAndMint();
  }, []);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.href = '/vaults';
    }
  }, [state.currentTxStatus]);

  return (
    <div className="max-w-4xl mx-auto">
      {state.currentTxId ? (
        <div className="mb-4">
          <Alert type={Alert.type.SUCCESS} title="Your vault is being created">
            <p>
              Successfully broadcasted the creation of your vault. This can take up to 15 minutes.
            </p>
            <p className="mt-1">
              Your vault will appear automatically on the Vaults page after creation.
            </p>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <ExplorerLink
                  txId={state.currentTxId}
                  className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                />
              </div>
            </div>
          </Alert>
        </div>
      ) : (
        <div className="mb-4">
          <Alert type={Alert.type.WARNING} title="Attention needed">
            <p>Confirm the transaction to create your new vault.</p>
          </Alert>
        </div>
      )}
    </div>
  );
};
