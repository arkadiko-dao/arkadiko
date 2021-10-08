import React, { useContext, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import {
  contractPrincipalCV,
  uintCV,
  stringAsciiCV,
  trueCV,
  falseCV,
  tupleCV,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  AnchorMode,
  createAssetInfo,
  makeContractFungiblePostCondition
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import { AppContext } from '@common/context';
import { ExclamationIcon, CheckCircleIcon } from '@heroicons/react/solid'

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [state, setState] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const callCollateralizeAndMint = async () => {
    const decimals = coinAmounts['token-type'].toLowerCase().includes('stx') ? 1000000 : 100000000
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const amount = uintCV(parseInt(coinAmounts['amounts']['collateral'], 10) * decimals);
    const args = [
      amount,
      uintCV(parseInt(coinAmounts['amounts']['usda'], 10) * 1000000),
      tupleCV({
        'stack-pox': ((coinAmounts['stack-pox'] && coinAmounts['token-type'].toLowerCase().includes('stx')) ? trueCV() : falseCV()),
        'auto-payoff': ((coinAmounts['auto-payoff'] && coinAmounts['token-type'].toLowerCase().includes('stx')) ? trueCV() : falseCV())
      }),
      stringAsciiCV(coinAmounts['token-type'].toUpperCase()),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(coinAmounts['token-name'].toUpperCase())),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1'),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1')
    ];

    let postConditions:any[] = [];
    let postConditionMode = 0x02;
    if (coinAmounts['token-name'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(
          address || '',
          FungibleConditionCode.Equal,
          amount.value
        )
      ];
    } else {
      postConditionMode = 0x01;
      postConditions = [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.LessEqual,
          200000000,
          createAssetInfo(
            contractAddress,
            'tokensoft-token',
            'xbtc'
          )
        )
      ];
    }

    await doContractCall({
      network,
      contractAddress,
      stxAddress: address,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'collateralize-and-mint',
      functionArgs: args,
      postConditions,
      postConditionMode,
      onFinish: data => {
        console.log('finished collateralizing!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'creating vault...' }));
      },
      onCancel: () => {
        window.location.href = '/';
      },
      anchorMode: AnchorMode.Any
    });
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
        <div className="p-4 border-l-4 border-green-400 rounded-tr-md rounded-br-md bg-green-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-5 h-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Your vault is being created.</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Successfully broadcasted the creation of your vault. This can take up to 15 minutes.</p>
                <p className="mt-1">Your vault will appear automatically on the Vaults page after creation.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <ExplorerLink txId={state.currentTxId} className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-l-4 border-yellow-400 rounded-tr-md rounded-br-md bg-yellow-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="w-5 h-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-yellow-800">Attention needed</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Confirm the transaction to create your new vault
                </p>
              </div>
            </div>
          </div>
        </div>
      )} 
    </div>
  );
};
