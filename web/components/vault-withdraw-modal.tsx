import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  showWithdrawModal: boolean;
  setShowWithdrawModal: (arg: boolean) => void;
  maximumCollateralToWithdraw: number;
  vault: VaultProps;
  reserveName: string;
}

export const VaultWithdrawModal: React.FC<Props> = ({
  match,
  showWithdrawModal,
  setShowWithdrawModal,
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
    const decimals = token === 'Wrapped-Bitcoin' ? 100000000 : 1000000;
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
          'arkadiko-collateral-types-v1-1'
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
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
    <Modal
      open={showWithdrawModal}
      title="Withdraw Collateral"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />}
      closeModal={() => setShowWithdrawModal(false)}
      buttonText="Withdraw"
      buttonAction={() => callWithdraw()}
      initialFocus={inputRef}
    >
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
    </Modal>
  );
};
