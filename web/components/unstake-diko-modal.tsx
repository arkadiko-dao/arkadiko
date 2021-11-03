import React, { useContext, useState } from 'react';
import { Modal } from '@blockstack/ui';
import { XIcon } from '@heroicons/react/outline';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode, contractPrincipalCV, uintCV,
  makeStandardFungiblePostCondition,
  FungibleConditionCode, createAssetInfo
 } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { Alert } from './ui/alert';

export const UnstakeDikoModal = ({ showUnstakeModal, setShowUnstakeModal, stakedAmount }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<Array<string>>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const unstakeDiko = async () => {
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(Number(stakeAmount) * 1000000).value,
        createAssetInfo(
          contractAddress,
          'stdiko-token',
          'stdiko'
        )
      )
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'unstake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
        uintCV(Number(stakeAmount) * 1000000)
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished broadcasting unstaking tx!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowUnstakeModal(false);
      },
      anchorMode: AnchorMode.Any
    });
  };

  const unstakeMaxAmount = () => {
    setStakeAmount(stakedAmount / 1000000);
  };

  const onInputStakeChange = (event:any) => {
    const value = event.target.value;
    // trying to unstake
    if (value > stakedAmount / 1000000) {
      if (errors.length < 1) {
        setErrors(errors.concat(['You cannot unstake more than currently staking']));
      }
    } else {
      setErrors([]);
    }
    setStakeAmount(value);
  };

  return (
    <Modal isOpen={showUnstakeModal}>
      <div className="flex items-end justify-center px-4 pt-6 pb-6 text-center sm:block sm:p-0">
        {errors.length > 0 ? (
          <div className="mt-4">
            <Alert type={Alert.type.ERROR}>
              {errors.map(txt => <p key={txt}>{txt}</p>)}
            </Alert>
          </div>
        ) : null}

        <div className="inline-block px-2 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
          <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowUnstakeModal(false)}
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
                Unstake DIKO
              </h3>
              <p className="mt-3 text-sm text-gray-500">
                You are currently staking {microToReadable(stakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO.
              </p>
              <div className="mt-6">
                <InputAmount
                  balance={microToReadable(stakedAmount).toLocaleString()}
                  token="DIKO"
                  inputName="unstakeDiko"
                  inputId="unstakeAmount"
                  inputValue={stakeAmount}
                  inputLabel="Unstake DIKO"
                  onInputChange={onInputStakeChange}
                  onClickMax={unstakeMaxAmount}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => unstakeDiko()}
            >
              Unstake
            </button>
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setShowUnstakeModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
