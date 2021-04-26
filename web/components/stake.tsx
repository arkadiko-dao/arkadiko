import React, { useEffect, useContext, useState } from 'react';
import { Box, Modal } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, contractPrincipalCV, uintCV, standardPrincipalCV, cvToJSON } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';

export const Stake = () => {
  const state = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [pendingRewards, setPendingRewards] = useState(0);
  const [apy, setApy] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [txId, setTxId] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const pendingRewards = await callReadOnlyFunction({
        contractAddress,
        contractName: "stake-pool-diko",
        functionName: "get-pending-rewards",
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      setPendingRewards(cvToJSON(pendingRewards).value.value / 1000000);

      const totalStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "stake-pool-diko",
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      setStakedAmount(cvToJSON(totalStakedCall).value);
      const totalStaked = cvToJSON(totalStakedCall).value / 1000000;

      const stakerInfoCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "stake-pool-diko",
        functionName: "get-stake-of",
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const stakerInfo = cvToJSON(stakerInfoCall).value;
      const dikoStaked = stakerInfo['uamount'].value / 1000000;
      const rewardsPerBlock = 1000000000; // TODO: fetch from stake-pool-diko smart contract
      const rewardPercentage = (totalStaked / dikoStaked);
      const dikoPerYear = 144 * 365 * (rewardsPerBlock * rewardPercentage) / 1000000;
      if (dikoStaked > 0) {
        setApy(((dikoPerYear / dikoStaked) * 100).toFixed(0));
      } else {
        setApy(0);
      }
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  useEffect(() => {
    let sub;

    const subscribe = async (txId:string) => {
      const client = await connectWebSocketClient('ws://localhost:3999');
      sub = await client.subscribeTxUpdates(txId, update => {
        console.log('Got an update:', update);
        if (update['tx_status'] == 'success') {
          window.location.reload(true);
        } else if (update['tx_status'] == 'abort_by_response') {
          setTxStatus('error');
        }
      });
      console.log({ client, sub });
    };
    if (txId) {
      console.log('Subscribing on updates with TX id:', txId);
      subscribe(txId);
    }
  }, [txId]);

  const onInputStakeChange = (event:any) => {
    const value = event.target.value;
    setStakeAmount(value);
  };

  const stakeDiko = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'stake-registry',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'stake-pool-diko'),
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
        uintCV(parseInt(stakeAmount, 10) * 1000000)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished broadcasting staking tx!', data);
        setTxId(data.txId);
        setTxStatus('pending');
        setShowStakeModal(false);
      },
    });
  };

  const claimRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'stake-registry',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'stake-pool-diko')
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished broadcasting claim rewards tx!', data);
        setTxId(data.txId);
        setTxStatus('pending');
      }
    });
  };

  const unstakeDiko = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'stake-registry',
      functionName: 'unstake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'stake-pool-diko'),
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
        uintCV(parseInt(stakeAmount, 10) * 1000000)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished broadcasting unstaking tx!', data);
        setTxId(data.txId);
        setTxStatus('pending');
        setShowUnstakeModal(false);
      },
    });
  };

  return (
    <Box>
      {txId ? (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end">
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    Successfully broadcasted transaction!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Status: {txStatus}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    This page will be reloaded automatically when the transaction succeeds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null }

      <Modal isOpen={showStakeModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Stake DIKO
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    You have a balance of {state.balance['diko'] / 1000000} DIKO
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    </div>
                    <input type="text" name="stakeDiko" id="stakeAmount"
                          value={stakeAmount}
                          onChange={onInputStakeChange}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00" aria-describedby="stake-diko" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stake-diko">
                        DIKO
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => stakeDiko()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Stake
              </button>

              <button type="button" onClick={() => setShowStakeModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUnstakeModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Unstake DIKO
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    You are current staking {stakedAmount / 1000000} DIKO
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    </div>
                    <input type="text" name="unstakeDiko" id="unstakeAmount"
                          value={stakeAmount}
                          onChange={onInputStakeChange}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00" aria-describedby="stake-diko" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stake-diko">
                        DIKO
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => unstakeDiko()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Unstake
              </button>

              <button type="button" onClick={() => setShowUnstakeModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {state.userData ? (
        <Container>
          <Box py={6}>
            <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                  <div className="bg-indigo-700">
                    <div className="max-w-2xl mx-auto text-center py-5 px-4 sm:py-5 sm:px-6 lg:px-8">
                      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        <span className="block">Arkadiko Staking</span>
                      </h2>
                      <p className="mt-4 text-lg leading-6 text-indigo-200">
                        Stake your DIKO tokens to earn rewards. For every DIKO staked, you get stDIKO in return which can be used to vote in governance.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-5 lg:grid-cols-5">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Staked Value
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {stakedAmount / 1000000} DIKO
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Pending Rewards
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {pendingRewards} DIKO
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Current APY
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {apy}%
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg col-span-2">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  <button type="button" onClick={() => setShowStakeModal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                    Stake
                                  </button>
                                  <button type="button" onClick={() => setShowUnstakeModal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                    Unstake
                                  </button>

                                  <button type="button" onClick={() => claimRewards()} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                    Claim Rewards
                                  </button>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </main>
          </Box>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </Box>
  );
};
