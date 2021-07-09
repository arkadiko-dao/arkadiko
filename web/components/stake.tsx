import React, { useEffect, useContext, useState } from 'react';
import { Modal } from '@blockstack/ui';
import { XIcon } from '@heroicons/react/outline';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import {
  callReadOnlyFunction, contractPrincipalCV, uintCV, cvToJSON,
  createAssetInfo, FungibleConditionCode, standardPrincipalCV,
  makeStandardFungiblePostCondition
 } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { InputAmount } from './input-amount';

export const Stake = () => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [apy, setApy] = useState(0);
  const [errors, setErrors] = useState<Array<string>>([]);
  const [stakedAmount, setStakedAmount] = useState(0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const totalStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-v1-1",
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      let totalStaked = cvToJSON(totalStakedCall).value / 1000000;

      const stDikoSupplyCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "stdiko-token",
        functionName: "get-total-supply",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const stDikoSupply = cvToJSON(stDikoSupplyCall).value.value;
      const userStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-v1-1",
        functionName: "get-stake-of",
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || ''),
          uintCV(stDikoSupply)
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let dikoStaked = cvToJSON(userStakedCall).value.value;
      setStakedAmount(dikoStaked);

      const dikoPerYear = 2350000; // TODO: hardcoded 23.5mio*10% for first year. 144 * 365 * (rewardsPerBlock) / 1000000;
      if (dikoStaked > 0) {
        dikoStaked = dikoStaked / 1000000;
        const rewardPercentage = (dikoStaked / totalStaked);
        setApy(((dikoPerYear / dikoStaked) * rewardPercentage * 100).toFixed(0));
      } else {
        dikoStaked = state.balance['diko'] / 1000000;
        if (totalStaked === 0) { totalStaked = dikoStaked };
        const rewardPercentage = (dikoStaked / totalStaked);
        setApy(((dikoPerYear / dikoStaked) * rewardPercentage * 100).toFixed(0));
      }
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, [state.balance]);

  const onInputStakeChange = (event:any) => {
    const value = event.target.value;
    if (showStakeModal) {
      // trying to stake
      if (value > state.balance['diko'] / 1000000) {
        if (errors.length < 1) {
          setErrors(errors.concat([`You cannot stake more than ${state.balance['diko'] / 1000000} DIKO`]));
        }
      } else {
        setErrors([]);
      }
    } else {
      // trying to unstake
      if (value > stakedAmount / 1000000) {
        if (errors.length < 1) {
          setErrors(errors.concat(['You cannot unstake more than currently staking']));
        }
      } else {
        setErrors([]);
      }
    }
    setStakeAmount(value);
  };

  const stakeDiko = async () => {
    const amount = uintCV(Number(stakeAmount) * 1000000);
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        amount.value,
        createAssetInfo(
          contractAddress,
          "arkadiko-token",
          "diko"
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
        amount
      ],
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished broadcasting staking tx!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowStakeModal(false);
      },
    });
  };

  const unstakeDiko = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'unstake',
      functionArgs: [
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
    });
  };

  const stakeMaxAmount = () => {
    setStakeAmount(state.balance['diko'] / 1000000);
  };

  const unstakeMaxAmount = () => {
    setStakeAmount(stakedAmount / 1000000);
  };

  return (
    <div>
      <Modal isOpen={showStakeModal}>
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
                  <p className="text-sm text-red-700">{errors[0]}</p>
                </div>
              </div>
            </div>
          ) : `` }

          <div className="inline-block align-bottom bg-white rounded-lg px-2 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowStakeModal(false)}
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
                  Stake DIKO
                </h3>
                <p className="mt-3 text-sm text-gray-500">
                  Stake DIKO tokens at {apy}% (estimated APY) and start earning rewards now.
                </p>
                <div className="mt-6">
                  <InputAmount
                    balance={microToReadable(state.balance['diko']).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    token="DIKO"
                    inputName="stakeDiko"
                    inputId="stakeAmount"
                    inputValue={stakeAmount}
                    inputLabel="Stack DIKO"
                    onInputChange={onInputStakeChange}
                    onClickMax={stakeMaxAmount}
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => stakeDiko()}
              >
                Stake
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowStakeModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

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
                  You are current staking {microToReadable(stakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO.
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

      {state.userData ? (
        <Container>
          <main className="flex-1 relative py-12">
            <section>
              <header>
                <div className="bg-indigo-700 rounded-md">
                  <div className="max-w-2xl mx-auto text-center py-5 px-4 sm:py-5 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                      <span className="block">Arkadiko Staking</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-indigo-200">
                      Stake your DIKO tokens to earn rewards. For every DIKO staked, <br/>
                      you get stDIKO in return which can be used to vote in governance.
                    </p>
                  </div>
                </div>
              </header>

              <div className="flex flex-col mt-8">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Staked Value
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Current APY
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Pending rewards
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr className="bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                                </div>
                                <div className="ml-4">
                                  {microToReadable(stakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {apy}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              auto-compounding
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <button type="button" onClick={() => setShowStakeModal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Stake
                              </button>

                              <button type="button" onClick={() => setShowUnstakeModal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Unstake
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </div>
  );
};
