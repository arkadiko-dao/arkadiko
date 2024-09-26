import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  createAssetInfo,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  someCV,
  standardPrincipalCV
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  outstandingDebt: () => void;
  stabilityFee: number;
  vault: VaultProps;
  reserveName: string;
}

export const VaultBurn: React.FC<Props> = ({
  match,
  outstandingDebt,
  stabilityFee,
  vault,
  reserveName,
  setShowBurnWarning
}) => {
  const [state, setState] = useContext(AppContext);
  const [usdToBurn, setUsdToBurn] = useState('');
  const [repayAllowed, setRepayAllowed] = useState(true);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);
  const collateralSymbol = match.params.collateral;
  const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];

  const callBurn = async () => {
    let totalToBurn = Number(usdToBurn) + parseFloat(1.3 * stabilityFee / 1000000);
    if (Number(totalToBurn) >= Number(state.balance['usda'] / 1000000)) {
      totalToBurn = Number(state.balance['usda'] / 1000000);
    }
    const postConditions = [
      makeStandardFungiblePostCondition(
        senderAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(parseInt(totalToBurn * 1000000 * 1.1, 10)).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    const tokenAddress = tokenInfo['address'];
    const token = tokenInfo['name'];
    const collateralAmount = vault.collateral;
    const debtAmount = Number(vault.debt) - Number(usdToBurn * 1000000);

    const BASE_URL = process.env.HINT_API_URL;
    const totalDebt = debtAmount + Number(stabilityFee);
    const url = BASE_URL + `?owner=${senderAddress}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${totalDebt}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);

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
        'arkadiko-oracle-v2-3'
      ),
      contractPrincipalCV(tokenAddress, token),
      uintCV(collateralAmount),
      uintCV(Math.max(0, parseInt(debtAmount, 10))),
      someCV(standardPrincipalCV(hint['prevOwner'])),
      uintCV(100)
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-vaults-operations-v1-2',
      functionName: 'update-vault',
      functionArgs: args,
      postConditions,
      onFinish: data => {
        console.log('finished burn!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const burnMaxAmount = () => {
    let debtToPay = Number(outstandingDebt()) * 1000000 + Number(stabilityFee);
    if (debtToPay > state.balance['usda']) {
      const balance = Number(state.balance['usda']);
      debtToPay = balance.toFixed(6);
    }
    setUsdToBurn((debtToPay / 1000000).toFixed(6));

    const debtAmount = Number(vault.debt) - Number(debtToPay);
    if (debtAmount < 500 * 1000000) {
      setShowBurnWarning(true);
      setRepayAllowed(true);
    } else {
      setShowBurnWarning(false);
      setRepayAllowed(false);
    }
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setUsdToBurn(value);

    const debtAmount = Number(vault.debt) - Number(value * 1000000);
    if (debtAmount < 500 * 1000000) {
      setShowBurnWarning(true);
      setRepayAllowed(true);
    } else {
      setShowBurnWarning(false);
      setRepayAllowed(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">Repay USDA debt</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        Choose how much USDA you want to burn. Burning will include a stability fee of maximum{' '}
        <span className="font-semibold">{(stabilityFee / 1000000).toFixed(6)} USDA</span>.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={(state.balance['usda'] / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="USDA"
          inputName="burnDebt"
          inputId="burnAmount"
          inputValue={usdToBurn}
          inputLabel="Burn USDA"
          onInputChange={onInputChange}
          onClickMax={burnMaxAmount}
          ref={inputRef}
        />
      </div>

      <div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => callBurn()}
          disabled={repayAllowed}
        >
          Repay
        </button>
      </div>
    </div>
  );
};
