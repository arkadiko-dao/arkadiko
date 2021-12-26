import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  createAssetInfo,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { Alert } from './ui/alert';

export const StakeLpModal = ({
  showStakeModal,
  setShowStakeModal,
  apy,
  balanceName,
  tokenName,
}) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStakeButtonDisabled, setIsStakeButtonDisabled] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const stakeMaxAmount = () => {
    setStakeAmount(state.balance[balanceName] / 1000000);
  };

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    // trying to stake
    if (value > state.balance[balanceName] / 1000000) {
      if (errors.length < 1) {
        setErrors(
          errors.concat([`You cannot stake more than ${state.balance[balanceName] / 1000000} DIKO`])
        );
      }
      setIsStakeButtonDisabled(true);
    } else {
      setErrors([]);
      setIsStakeButtonDisabled(false);
    }
    setStakeAmount(value);
  };

  const stake = async () => {
    const amount = uintCV(Number(stakeAmount) * 1000000);
    let contractName = 'arkadiko-stake-pool-diko-usda-v1-1';
    let tokenContract = 'arkadiko-swap-token-diko-usda';
    let ftContract = 'diko-usda';
    if (balanceName === 'wstxusda') {
      contractName = 'arkadiko-stake-pool-wstx-usda-v1-1';
      tokenContract = 'arkadiko-swap-token-wstx-usda';
      ftContract = 'wstx-usda';
    } else if (balanceName === 'wstxdiko') {
      contractName = 'arkadiko-stake-pool-wstx-diko-v1-1';
      tokenContract = 'arkadiko-swap-token-wstx-diko';
      ftContract = 'wstx-diko';
    }
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        amount.value,
        createAssetInfo(contractAddress, tokenContract, ftContract)
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, contractName),
        contractPrincipalCV(contractAddress, tokenContract),
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
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const lpPairTokenX = tokenList.findIndex(obj => obj.name == tokenName.split('/').slice(0, 1));
  const lpPairTokenY = tokenList.findIndex(obj => obj.name == tokenName.split('/').slice(1));

  return (
    <Modal
      open={showStakeModal}
      title={`Stake ${tokenName} LP Tokens`}
      icon={
        <div className="flex -space-x-2">
          <img
            className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
            src={tokenList[lpPairTokenX].logo}
            alt=""
          />
          <img
            className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
            src={tokenList[lpPairTokenY].logo}
            alt=""
          />
        </div>
      }
      closeModal={() => setShowStakeModal(false)}
      buttonText="Stake"
      buttonAction={() => stake()}
      buttonDisabled={isStakeButtonDisabled || errors.length > 0}
      initialFocus={inputRef}
    >
      {errors.length > 0 ? (
        <Alert type={Alert.type.ERROR}>
          <p>{errors[0]}</p>
        </Alert>
      ) : null}

      <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
        Stake your {tokenName} LP tokens at {apy}% (estimated APR) and start earning rewards now.
      </p>
      <div className="mt-6">
        <InputAmount
          balance={microToReadable(state.balance[balanceName]).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token={tokenName}
          inputName={`stakeLp-${tokenName}`}
          inputId={`stakeAmount-${tokenName}`}
          inputValue={stakeAmount}
          inputLabel={`Stake ${tokenName}`}
          onInputChange={onInputStakeChange}
          onClickMax={stakeMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
