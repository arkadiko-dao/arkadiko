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
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import { AppContext } from '@common/context';
import { Alert } from './ui/alert';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [state, setState] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const callCollateralizeAndMint = async () => {
    const decimals = coinAmounts['token-type'].toLowerCase().includes('stx') ? 1000000 : 100000000;
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const tokenAddress = tokenTraits[coinAmounts['token-name'].toLowerCase()]['address'];
    const amount = uintCV(parseInt(coinAmounts['amounts']['collateral'] * decimals, 10));
    const args = [
      amount,
      uintCV(parseInt(coinAmounts['amounts']['usda'], 10) * 1000000),
      tupleCV({
        'stack-pox':
          coinAmounts['stack-pox'] && coinAmounts['token-type'].toLowerCase().includes('stx')
            ? trueCV()
            : falseCV(),
        'auto-payoff':
          coinAmounts['auto-payoff'] && coinAmounts['token-type'].toLowerCase().includes('stx')
            ? trueCV()
            : falseCV(),
      }),
      stringAsciiCV(coinAmounts['token-type'].toUpperCase()),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        resolveReserveName(coinAmounts['token-name'].toUpperCase())
      ),
      contractPrincipalCV(tokenAddress, token),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-collateral-types-v1-1'
      ),
      contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
    ];

    let postConditions: any[] = [];
    let postConditionMode = 0x02;
    if (coinAmounts['token-name'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(address || '', FungibleConditionCode.Equal, amount.value),
      ];
    } else {
      postConditions = [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.LessEqual,
          amount.value,
          createAssetInfo('SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR', 'Wrapped-Bitcoin', 'wrapped-bitcoin')
        ),
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
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'creating vault...',
        }));
      },
      onCancel: () => {
        window.location.href = '/';
      },
      anchorMode: AnchorMode.Any,
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
