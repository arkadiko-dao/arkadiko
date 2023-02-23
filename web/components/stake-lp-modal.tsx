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
  standardPrincipalCV,
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
  decimals
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
    setStakeAmount(state.balance[balanceName] / Math.pow(10, decimals));
  };

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    // trying to stake
    if (value > state.balance[balanceName] / Math.pow(10, decimals)) {
      if (errors.length < 1) {
        setErrors(
          errors.concat([`You cannot stake more than ${state.balance[balanceName] / Math.pow(10, decimals)} LP tokens`])
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
      tokenContract = 'token-amm-swap-pool';
      assetContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
      ftContract = 'amm-swap-pool';
    } else if (balanceName === 'xusdusda2') {
      contractName = 'arkadiko-stake-pool-xusd-usda-v1-5';
      tokenContract = 'token-amm-swap-pool';
      assetContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
      ftContract = 'amm-swap-pool';
    }
    
    console.log(assetContractAddress, tokenContract, ftContract);
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        amount.value,
        createAssetInfo(assetContractAddress, tokenContract, ftContract)
      ),
    ];

    if (balanceName === 'xusdusda' || balanceName === 'xusdusda2') {
      await doContractCall({
        network,
        contractAddress,
        stxAddress,
        contractName: contractName,
        functionName: 'stake',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          contractPrincipalCV(assetContractAddress, tokenContract),
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

    } else {
      await doContractCall({
        network,
        contractAddress,
        stxAddress,
        contractName: 'arkadiko-stake-registry-v1-1',
        functionName: 'stake',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          contractPrincipalCV(contractAddress, contractName),
          contractPrincipalCV(assetContractAddress, tokenContract),
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
    }
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
        <div className="mb-4">
          <Alert type={Alert.type.ERROR}>
            <p>{errors[0]}</p>
          </Alert>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
        Stake your {tokenName} LP tokens at {apy}% (estimated APR) and start earning rewards now.
      </p>
      <div className="mt-6">
        <InputAmount
          balance={microToReadable(state.balance[balanceName], decimals).toLocaleString(undefined, {
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
