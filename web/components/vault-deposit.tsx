import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { Alert } from './ui/alert';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  createAssetInfo
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import BN from 'bn.js';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  vault: VaultProps;
  reserveName: string;
  decimals: number;
}

export const VaultDeposit: React.FC<Props> = ({
  match,
  vault,
  reserveName,
  decimals,
}) => {
  const [state, setState] = useContext(AppContext);
  const [extraCollateralDeposit, setExtraCollateralDeposit] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';

  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const addDeposit = async () => {
    if (!extraCollateralDeposit) {
      return;
    }
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    const decimals = token === 'Wrapped-Bitcoin' || token === 'auto-alex' ? 100000000 : 1000000;
    const tokenAddress = tokenTraits[vault['collateralToken'].toLowerCase()]['address'];

    let postConditions: any[] = [];
    if (vault['collateralToken'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(
          senderAddress || '',
          FungibleConditionCode.Equal,
          new BN(parseFloat(extraCollateralDeposit) * decimals)
        ),
      ];
    } else if (vault['collateralToken'].toLowerCase() === 'xbtc') {
      postConditions = [
        makeStandardFungiblePostCondition(
          senderAddress || '',
          FungibleConditionCode.LessEqual,
          new BN(parseFloat(extraCollateralDeposit) * decimals),
          createAssetInfo(
            xbtcContractAddress,
            'Wrapped-Bitcoin',
            'wrapped-bitcoin'
          )
        ),
      ];
    } else {
      postConditions = [
        makeStandardFungiblePostCondition(
          senderAddress || '',
          FungibleConditionCode.LessEqual,
          new BN(parseFloat(extraCollateralDeposit) * decimals),
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
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'deposit',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(extraCollateralDeposit) * decimals),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(tokenAddress, token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
      ],
      postConditions,
      onFinish: data => {
        console.log('finished deposit!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowDepositModal(false);
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const depositMaxAmount = () => {
    const token = vault['collateralToken'].toLowerCase();
    const decimals = token === 'xbtc' || token === 'auto-alex' ? 100000000 : 1000000;
    if (token === 'stx') {
      setExtraCollateralDeposit((state.balance['stx'] / decimals - 1).toString());
    } else {
      setExtraCollateralDeposit((state.balance[token] / decimals).toString());
    }
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setExtraCollateralDeposit(value);
  };

  return (
    <div>
      <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">Deposit extra collateral</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        You have a balance of{' '}
        <span className="font-semibold">
          {state.balance[vault?.collateralToken.toLowerCase()] / decimals}{' '}
          {vault?.collateralToken.toUpperCase()}
        </span>
        . Depositing extra collateral allows you to mint more USDA.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={(state.balance[vault?.collateralToken.toLowerCase()] / decimals).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            }
          )}
          token={vault?.collateralToken.toUpperCase()}
          inputName="depositCollateral"
          inputId="depositExtraStxAmount"
          inputValue={extraCollateralDeposit}
          inputLabel="Deposit Extra Collateral"
          onInputChange={onInputChange}
          onClickMax={depositMaxAmount}
          ref={inputRef}
        />
      </div>

      <div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => addDeposit()}
        >
          Deposit
        </button>
      </div>
    </div>
  );
};