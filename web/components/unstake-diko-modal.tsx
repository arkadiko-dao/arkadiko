import React, { useContext, useState } from 'react';
import { Modal } from '@blockstack/ui';
import { XIcon } from '@heroicons/react/outline';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';

export const UnstakeDikoModal = ({ showUnstakeModal, setShowUnstakeModal, stakedAmount }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<Array<string>>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const unstakeDiko = async () => {
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
      finished: data => {
        console.log('finished broadcasting unstaking tx!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowUnstakeModal(false);
      },
      anchorMode: AnchorMode.Any
    });
  };

  const unstakeMaxAmount = () => {
    setStakeAmount(state.balance['stdiko'] / 1000000);
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
      <div className="flex items-end justify-center pt-6 px-4 pb-6 text-center sm:block sm:p-0">
        {errors.length > 0 ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                {errors.map(txt => <p className="text-sm text-red-700" key={txt}>{txt}</p>)}
              </div>
            </div>
          </div>
        ) : `` }

        <div className="inline-block align-bottom bg-white rounded-lg px-2 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowUnstakeModal(false)}
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mx-auto flex items-center justify-center rounded-full">
            <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
          </div>
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                Unstake DIKO
              </h3>
              <p className="mt-3 text-sm text-gray-500">
                You are currently staking {microToReadable(stakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO.
              </p>
              <div className="mt-6">
                <InputAmount
                  balance={microToReadable(state.balance['stdiko']).toLocaleString()}
                  token="stDIKO"
                  inputName="unstakeDiko"
                  inputId="unstakeAmount"
                  inputValue={stakeAmount}
                  inputLabel="Unstack DIKO"
                  onInputChange={onInputStakeChange}
                  onClickMax={unstakeMaxAmount}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => unstakeDiko()}
            >
              Unstake
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
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
