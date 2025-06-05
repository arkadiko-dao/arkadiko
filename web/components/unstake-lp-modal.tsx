import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { makeContractCall } from '@common/contract-call';
import { Alert } from './ui/alert';

export const UnstakeLpModal = ({
  showUnstakeModal,
  setShowUnstakeModal,
  stakedAmount,
  balanceName,
  tokenName,
  decimals
}) => {
  const [_, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isUnstakeButtonDisabled, setIsUnstakeButtonDisabled] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const inputRef = useRef<HTMLInputElement>(null);

  const unstake = async () => {
    const amount = uintCV(Number((parseFloat(stakeAmount) * Math.pow(10, decimals)).toFixed(0)));
    let contractName = 'arkadiko-stake-pool-diko-usda-v1-1';
    let tokenContract = 'arkadiko-swap-token-diko-usda';
    let ftContract = 'diko-usda';
    let assetContractAddress = contractAddress;
    if (balanceName === 'wstxusda') {
      contractName = 'arkadiko-stake-pool-wstx-usda-v1-1';
      tokenContract = 'arkadiko-swap-token-wstx-usda';
      ftContract = 'wstx-usda';
    } else if (balanceName === 'wstxdiko') {
      contractName = 'arkadiko-stake-pool-wstx-diko-v1-1';
      tokenContract = 'arkadiko-swap-token-wstx-diko';
      ftContract = 'wstx-diko';
    } else if (balanceName === 'wstxxbtc') {
      contractName = 'arkadiko-stake-pool-wstx-xbtc-v1-1';
      tokenContract = 'arkadiko-swap-token-wstx-xbtc';
      ftContract = 'wstx-xbtc';
    } else if (balanceName === 'xbtcusda') {
      contractName = 'arkadiko-stake-pool-xbtc-usda-v1-1';
      tokenContract = 'arkadiko-swap-token-xbtc-usda';
      ftContract = 'xbtc-usda';
    } else if (balanceName === 'xusdusda') {
      contractName = 'arkadiko-stake-pool-xusd-usda-v1-4';
      assetContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
      tokenContract = 'token-amm-swap-pool';
      ftContract = 'amm-swap-pool';
    } else if (balanceName === 'xusdusda2') {
      contractName = 'arkadiko-stake-pool-xusd-usda-v1-5';
      assetContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
      tokenContract = 'token-amm-swap-pool';
      ftContract = 'amm-swap-pool';
    }

    if (balanceName === 'xusdusda' || balanceName === 'xusdusda2') {
      await request('stx_callContract', {
        network,
        contractAddress,
        stxAddress,
        contractName: contractName,
        functionName: 'unstake',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
          contractPrincipalCV(assetContractAddress, tokenContract),
          amount,
        ],
        postConditionMode: 0x01,
        onFinish: data => {
          console.log('finished broadcasting unstaking tx!', data);
          setState(prevState => ({
            ...prevState,
            currentTxId: data.txId,
            currentTxStatus: 'pending',
          }));
          setShowUnstakeModal(false);
        },
        anchorMode: AnchorMode.Any,
      }, resolveProvider() || window.StacksProvider);
    } else {
      await request('stx_callContract', {
        network,
        contractAddress,
        stxAddress,
        contractName: 'arkadiko-stake-registry-v2-1',
        functionName: 'unstake',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
          contractPrincipalCV(contractAddress, contractName),
          contractPrincipalCV(contractAddress, tokenContract),
          amount,
        ],
        postConditionMode: 0x01,
        onFinish: data => {
          console.log('finished broadcasting unstaking tx!', data);
          setState(prevState => ({
            ...prevState,
            currentTxId: data.txId,
            currentTxStatus: 'pending',
          }));
          setShowUnstakeModal(false);
        },
        anchorMode: AnchorMode.Any,
      }, resolveProvider() || window.StacksProvider);
    }
  };

  const unstakeMaxAmount = () => {
    setStakeAmount(stakedAmount / Math.pow(10, decimals));
  };

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    // trying to unstake
    if (value > stakedAmount / Math.pow(10, decimals)) {
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

  const lpPairTokenX = tokenList.findIndex(obj => obj.name == tokenName.split('/').slice(0, 1));
  const lpPairTokenY = tokenList.findIndex(obj => obj.name == tokenName.split('/').slice(1));

  return (
    <Modal
      open={showUnstakeModal}
      title={`Unstake ${tokenName} LP Tokens`}
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
      closeModal={() => setShowUnstakeModal(false)}
      buttonText="Unstake"
      buttonAction={() => unstake()}
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
        {microToReadable(stakedAmount, decimals).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        {tokenName}.
      </p>
      <div className="mt-6">
        <InputAmount
          balance={microToReadable(stakedAmount, decimals).toLocaleString()}
          token={tokenName}
          inputName={`unstakeLp-${tokenName}`}
          inputId={`unstakeAmount-${tokenName}`}
          inputValue={stakeAmount}
          inputLabel={`Unstake ${tokenName}`}
          onInputChange={onInputStakeChange}
          onClickMax={unstakeMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
