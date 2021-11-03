import React, { useContext, useState } from 'react';
import { Modal } from '@blockstack/ui';
import { XIcon } from '@heroicons/react/outline';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode, contractPrincipalCV, uintCV,
  createAssetInfo, FungibleConditionCode,
  makeStandardFungiblePostCondition
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { Alert } from './ui/alert';

export const StakeLpModal = ({ showStakeModal, setShowStakeModal, apy, balanceName, tokenName }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<Array<string>>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const stakeMaxAmount = () => {
    setStakeAmount(state.balance[balanceName] / 1000000);
  };

  const onInputStakeChange = (event:any) => {
    const value = event.target.value;
    // trying to stake
    if (value > state.balance[balanceName] / 1000000) {
      if (errors.length < 1) {
        setErrors(errors.concat([`You cannot stake more than ${state.balance[balanceName] / 1000000} DIKO`]));
      }
    } else {
      setErrors([]);
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
        createAssetInfo(
          contractAddress,
          tokenContract,
          ftContract
        )
      )
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
        amount
      ],
      postConditions,
      onFinish: data => {
        console.log('finished broadcasting staking tx!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowStakeModal(false);
      },
      anchorMode: AnchorMode.Any
    });
  };

  return (
    <Modal isOpen={showStakeModal}>
      <div className="flex items-end justify-center px-4 pt-6 pb-6 text-center sm:block sm:p-0">
        {errors.length > 0 ? (
          <div className="mt-4">
            <Alert type={Alert.type.ERROR}>
              <p>{errors[0]}</p>
            </Alert>
          </div>
        ) : `` }

        <div className="inline-block px-2 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
          <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowStakeModal(false)}
            >
              <span className="sr-only">Close</span>
              <XIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center justify-center mx-auto rounded-full">
            <img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />
          </div>
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
                Stake {tokenName} LP Tokens
              </h3>
              <p className="mt-3 text-sm text-gray-500">
                Stake your {tokenName} LP tokens at {apy}% (estimated APY) and start earning rewards now.
              </p>
              <div className="mt-6">
                <InputAmount
                  balance={microToReadable(state.balance[balanceName]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  token={tokenName}
                  inputName="stakeDiko"
                  inputId="stakeAmount"
                  inputValue={stakeAmount}
                  inputLabel={`Stake ${tokenName}`}
                  onInputChange={onInputStakeChange}
                  onClickMax={stakeMaxAmount}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => stake()}
            >
              Stake
            </button>
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setShowStakeModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
