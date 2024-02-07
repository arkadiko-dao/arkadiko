import React, { useContext, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import {
  contractPrincipalCV,
  uintCV,
  stringAsciiCV,
  standardPrincipalCV,
  trueCV,
  falseCV,
  tupleCV,
  someCV,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  AnchorMode,
  createAssetInfo,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ExplorerLink } from './explorer-link';
import { atAlexContractAddress, stStxContractAddress, resolveReserveName, tokenTraits, calculateMintFee } from '@common/vault-utils';
import { AppContext } from '@common/context';
import { Alert } from './ui/alert';

export const CreateVaultTransact = ({ coinAmounts }) => {
  const [state, setState] = useContext(AppContext);
  const { doContractCall } = useConnect();
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';

  const callCollateralizeAndMint = async () => {
    const decimals = coinAmounts['token-name'].toLowerCase().includes('stx') ? 1000000 : 100000000;
    const token = tokenTraits[coinAmounts['token-name'].toLowerCase()]['name'];
    const tokenAddress = tokenTraits[coinAmounts['token-name'].toLowerCase()]['address'];
    const collateralAmount = parseInt(coinAmounts['amounts']['collateral'] * decimals, 10);
    const debtAmount = parseInt(coinAmounts['amounts']['usda'], 10) * 1000000;
    const amount = uintCV(collateralAmount);

    const BASE_URL = process.env.HINT_API_URL;
    const url = BASE_URL + `?owner=${address}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${debtAmount}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);
    const mintFee = await calculateMintFee(debtAmount);

    const args = [
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-tokens-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-data-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-sorted-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-pool-active-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-helpers-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-oracle-v2-2'
      ),
      contractPrincipalCV(tokenAddress, token),
      amount,
      uintCV(debtAmount),
      someCV(standardPrincipalCV(hint['prevOwner'])),
      uintCV(mintFee)
    ];

    let postConditions: any[] = [];
    const postConditionMode = 0x02;
    if (coinAmounts['token-name'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(address || '', FungibleConditionCode.Equal, amount.value),
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.LessEqual,
          amount.value,
          createAssetInfo(
            process.env.REACT_APP_CONTRACT_ADDRESS || '',
            'wstx-token',
            'wstx'
          )
        )
      ];
    } else if (coinAmounts['token-name'].toLowerCase() === 'xbtc') {
      postConditions = [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.LessEqual,
          amount.value,
          createAssetInfo(
            xbtcContractAddress,
            'Wrapped-Bitcoin',
            'wrapped-bitcoin'
          )
        ),
      ];
    } else if (coinAmounts['token-name'].toLowerCase() === 'ststx') {
      postConditions = [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.LessEqual,
          amount.value,
          createAssetInfo(
            stStxContractAddress,
            'ststx-token',
            'ststx'
          )
        ),
      ];
    } else {
      // atALEX
      postConditions = [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.LessEqual,
          amount.value,
          createAssetInfo(
            atAlexContractAddress,
            'auto-alex',
            'auto-alex'
          )
        ),
      ];
    }

    await doContractCall({
      network,
      contractAddress,
      stxAddress: address,
      contractName: 'arkadiko-vaults-operations-v1-1',
      functionName: 'open-vault',
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
    }, resolveProvider() || window.StacksProvider);
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
