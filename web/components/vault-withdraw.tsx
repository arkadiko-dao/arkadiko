import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  maximumCollateralToWithdraw: number;
  vault: VaultProps;
  reserveName: string;
}

export const VaultWithdraw: React.FC<Props> = ({
  match,
  maximumCollateralToWithdraw,
  vault,
  reserveName,
}) => {
  const [_, setState] = useContext(AppContext);
  const [collateralToWithdraw, setCollateralToWithdraw] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const callWithdraw = async () => {
    if (parseFloat(collateralToWithdraw) > maximumCollateralToWithdraw) {
      return;
    }

    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    const decimals = token === 'Wrapped-Bitcoin' || token === 'auto-alex' ? 100000000 : 1000000;
    const amount = uintCV(Number((parseFloat(collateralToWithdraw) * decimals).toFixed(0)));
    const tokenAddress = tokenTraits[vault['collateralToken'].toLowerCase()]['address'];
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'withdraw',
      functionArgs: [
        uintCV(match.params.id),
        amount,
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(tokenAddress, token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v2-2'),
      ],
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
    });
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
      <p className="text-sm text-center text-gray-500 dark:text-zinc-400">
        Choose how much collateral you want to withdraw. You can withdraw a maximum of{' '}
        <span className="font-semibold">
          {maximumCollateralToWithdraw} {vault?.collateralToken.toUpperCase()}
        </span>
        .
      </p>
      <p className="text-sm text-center text-gray-500 dark:text-zinc-400">
        We will automatically harvest any DIKO you are eligible for when withdrawing.
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
