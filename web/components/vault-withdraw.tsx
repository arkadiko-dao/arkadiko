import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { AnchorMode, contractPrincipalCV, uintCV, someCV, standardPrincipalCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  maximumCollateralToWithdraw: number;
  vault: VaultProps;
  reserveName: string;
  stabilityFee: number;
}

export const VaultWithdraw: React.FC<Props> = ({
  match,
  maximumCollateralToWithdraw,
  vault,
  reserveName,
  stabilityFee
}) => {
  const [_, setState] = useContext(AppContext);
  const [collateralToWithdraw, setCollateralToWithdraw] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);
  const collateralSymbol = match.params.collateral;
  const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];

  const callWithdraw = async () => {
    if (parseFloat(collateralToWithdraw) > maximumCollateralToWithdraw) {
      return;
    }

    const tokenAddress = tokenInfo['address'];
    const token = tokenInfo['name'];
    const decimals = token === 'Wrapped-Bitcoin' || token === 'auto-alex' ? 100000000 : 1000000;
    const collateralAmount = Number(vault.collateral) - Number(parseFloat(collateralToWithdraw) * decimals);
    const debtAmount = Number(vault.debt);

    const BASE_URL = process.env.HINT_API_URL;
    const url = BASE_URL + `?owner=${senderAddress}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${debtAmount}`;
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
      uintCV(debtAmount),
      someCV(standardPrincipalCV(hint['prevOwner'])),
      uintCV(100)
    ];
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-vaults-operations-v1-1',
      functionName: 'update-vault',
      functionArgs: args,
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished withdraw!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowWithdrawModal(false);
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const withdrawMaxAmount = () => {
    return setCollateralToWithdraw(String(maximumCollateralToWithdraw));
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setCollateralToWithdraw(value);
  };

  return (
    <div>
      <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">Withdraw collateral</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        The amount of collateral you are able to withdraw while keeping a healthy collateralization level is{' '}
        <span className="font-semibold">
          {maximumCollateralToWithdraw} {vault?.collateralToken.toUpperCase()}
        </span>
        . Withdrawing will include a stability fee of maximum <span className="font-semibold">{stabilityFee / 1000000} USDA</span>.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={maximumCollateralToWithdraw}
          token={vault?.collateralToken.toUpperCase()}
          inputName="withdrawCollateral"
          inputId="withdrawCollateralAmount"
          inputValue={collateralToWithdraw}
          inputLabel="Withdraw Collateral"
          onInputChange={onInputChange}
          onClickMax={withdrawMaxAmount}
          ref={inputRef}
        />
      </div>

      <div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => callWithdraw()}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};
