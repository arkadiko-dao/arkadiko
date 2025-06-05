import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import {
  Cl
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { makeContractCall } from '@common/contract-call';
import { Alert } from './ui/alert';

export const UnstakeDikoModal = ({ showUnstakeModal, setShowUnstakeModal, stakedAmount }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isUnstakeButtonDisabled, setIsUnstakeButtonDisabled] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const inputRef = useRef<HTMLInputElement>(null);

  const unstakeDiko = async () => {
    const amount = Cl.uint(Number((parseFloat(stakeAmount) * 1000000).toFixed(0)));
    const postConditions = [
      {
        type: "ft-postcondition",
        address: stxAddress!,
        condition: "lte",
        amount: amount.value,
        asset: `${contractAddress}.stdiko-token::stdiko`,
      },
    ];

    await makeContractCall(
      {
        stxAddress,
        contractAddress,
        contractName: 'arkadiko-stake-registry-v2-1',
        functionName: 'unstake',
        functionArgs: [
          Cl.contractPrincipal(contractAddress, 'arkadiko-stake-registry-v2-1'),
          Cl.contractPrincipal(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
          Cl.contractPrincipal(contractAddress, 'arkadiko-token'),
          amount,
        ],
        postConditionMode: 'allow',
        network,
      },
      async (error?, txId?) => {
        setState(prevState => ({
          ...prevState,
          currentTxId: txId,
          currentTxStatus: 'pending',
        }));
      }
    );
  };

  const unstakeMaxAmount = () => {
    setStakeAmount(state.balance['stdiko'] / 1000000);
  };

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    // trying to unstake
    if (value > state.balance['stdiko'] / 1000000) {
      if (errors.length < 1) {
        setErrors(errors.concat(['You cannot unstake more than currently staking']));
      }
      setIsUnstakeButtonDisabled(true);
    } else {
      setErrors([]);
      setIsUnstakeButtonDisabled(false);
    }
    setStakeAmount(value);
  };

  return (
    <Modal
      open={showUnstakeModal}
      title="Unstake stDIKO"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />}
      closeModal={() => setShowUnstakeModal(false)}
      buttonText="Unstake"
      buttonAction={() => unstakeDiko()}
      buttonDisabled={isUnstakeButtonDisabled || errors.length > 0}
      initialFocus={inputRef}
    >
      {errors.length > 0 ? (
        <div className="mb-4">
          <Alert type={Alert.type.ERROR}>
            {errors.map(txt => (
              <p key={txt}>{txt}</p>
            ))}
          </Alert>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
        You are currently staking{' '}
        {microToReadable(state.balance['stdiko']).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        stDIKO which equals to{' '}
        {microToReadable(stakedAmount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        DIKO.
      </p>
      <div className="mt-6">
        <InputAmount
          balance={microToReadable(state.balance['stdiko']).toLocaleString()}
          token="stDIKO"
          inputName="unstakeDiko"
          inputId="unstakeAmount"
          inputValue={stakeAmount}
          inputLabel="Unstake DIKO"
          onInputChange={onInputStakeChange}
          onClickMax={unstakeMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
