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

interface Props {
  showStakeModal: boolean;
  setShowStakeModal: (arg: boolean) => void;
  apy: number;
}

export const StakeDikoModal: React.FC<Props> = ({ showStakeModal, setShowStakeModal, apy }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStakeButtonDisabled, setIsStakeButtonDisabled] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const inputRef = useRef<HTMLInputElement>(null);

  const stakeMaxAmount = () => {
    setStakeAmount((state.balance['diko'] / 1000000).toString());
  };

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    // trying to stake
    if (value > state.balance['diko'] / 1000000) {
      if (errors.length < 1) {
        setErrors(
          errors.concat([`You cannot stake more than ${state.balance['diko'] / 1000000} DIKO`])
        );
      }
      setIsStakeButtonDisabled(true);
    } else {
      setErrors([]);
      setIsStakeButtonDisabled(false);
    }
    setStakeAmount(value);
  };

  const stakeDiko = async () => {
    const amount = Cl.uint(Number((parseFloat(stakeAmount) * 1000000).toFixed(0)));
    const postConditions = [
      {
        type: "ft-postcondition",
        address: stxAddress!,
        condition: "eq",
        amount: amount.value,
        asset: `${contractAddress}.arkadiko-token::diko`,
      },
    ];
    await request('stx_callContract', {
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake',
      functionArgs: [
        Cl.contractPrincipal(contractAddress, 'arkadiko-stake-registry-v2-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-token'),
        amount,
      ],
      postConditions,
      onFinish: data => {
        console.log('finished broadcasting staking tx!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowStakeModal(false);
      }
    }, resolveProvider() || window.StacksProvider);
  };

  return (
    <Modal
      open={showStakeModal}
      title="Stake DIKO"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />}
      closeModal={() => setShowStakeModal(false)}
      buttonText="Stake"
      buttonAction={() => stakeDiko()}
      buttonDisabled={isStakeButtonDisabled || errors.length > 0}
      initialFocus={inputRef}
    >
      {errors.length > 0 ? (
        <div className="mb-4">
          <Alert type={Alert.type.ERROR}>
            <p>{errors[0]}</p>
          </Alert>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
        Stake DIKO tokens at {apy}% (estimated APR) and start earning rewards now.
      </p>
      <div className="mt-6">
        <InputAmount
          balance={microToReadable(state.balance['diko']).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="DIKO"
          inputName="stakeDiko"
          inputId="stakeAmount"
          inputValue={stakeAmount}
          inputLabel="Stake DIKO"
          onInputChange={onInputStakeChange}
          onClickMax={stakeMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
