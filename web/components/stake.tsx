import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import {
  callReadOnlyFunction, contractPrincipalCV, uintCV, cvToJSON, standardPrincipalCV
} from '@stacks/transactions';
import { StakeDikoModal } from './stake-diko-modal';
import { UnstakeDikoModal } from './unstake-diko-modal';
import { StakeLpModal } from './stake-lp-modal';
import { UnstakeLpModal } from './unstake-lp-modal';
import { useSTXAddress } from '@common/use-stx-address';
import { microToReadable } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { useConnect } from '@stacks/connect-react';

export const Stake = () => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showStakeLp1Modal, setShowStakeLp1Modal] = useState(false);
  const [showStakeLp2Modal, setShowStakeLp2Modal] = useState(false);
  const [showUnstakeLp1Modal, setShowUnstakeLp1Modal] = useState(false);
  const [showUnstakeLp2Modal, setShowUnstakeLp2Modal] = useState(false);
  const [apy, setApy] = useState(0);
  const [dikoLpApy, setDikoLpApy] = useState(0);
  const [stxLpApy, setStxLpApy] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [lpDikoStakedAmount, setLpDikoStakedAmount] = useState(0);
  const [lpStxStakedAmount, setLpStxStakedAmount] = useState(0);
  const [lpDikoPendingRewards, setLpDikoPendingRewards] = useState(0);
  const [lpStxPendingRewards, setLpStxPendingRewards] = useState(0);
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

      const userLpDikoStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-usda-v1-1",
        functionName: "get-stake-amount-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let dikoLpStaked = cvToJSON(userLpDikoStakedCall).value;
      setLpDikoStakedAmount(dikoLpStaked);

      const userLpStxStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-usda-v1-1",
        functionName: "get-stake-amount-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let stxLpStaked = cvToJSON(userLpStxStakedCall).value;
      setLpStxStakedAmount(stxLpStaked);

      const dikoPendingRewardsCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-usda-v1-1",
        functionName: "get-pending-rewards",
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let dikoLpPendingRewards = cvToJSON(dikoPendingRewardsCall).value.value;
      setLpDikoPendingRewards(dikoLpPendingRewards);

      const stxPendingRewardsCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-usda-v1-1",
        functionName: "get-pending-rewards",
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let stxLpPendingRewards = cvToJSON(stxPendingRewardsCall).value.value;
      setLpStxPendingRewards(stxLpPendingRewards);

      const dikoPoolPerYear = 2350000; // TODO: hardcoded 23.5mio*10% for first year. 144 * 365 * (rewardsPerBlock) / 1000000;
      if (totalStaked === 0) { totalStaked = state.balance['diko'] / 1000000; };
      if (totalStaked === 0) { totalStaked = 1 };
      setApy(Number((100 * (dikoPoolPerYear / totalStaked)).toFixed(2)));

      const dikoLpPoolPerYear = 23500000 * 30 / 100;
      setDikoLpApy(Number((100 * (dikoLpPoolPerYear / totalStaked)).toFixed(2)));

      const stxLpPoolPerYear = 23500000 * 60 / 100;
      setStxLpApy(Number((100 * (stxLpPoolPerYear / totalStaked)).toFixed(2)));
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, [state.balance]);

  const claimDikoLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-usda-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const claimStxLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-usda-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const stakeDikoLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-usda-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-token')
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const stakeStxLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-usda-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-token')
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  return (
    <div>
      <StakeDikoModal
        showStakeModal={showStakeModal}
        setShowStakeModal={setShowStakeModal}
        apy={apy}
      />

      <UnstakeDikoModal
        showUnstakeModal={showUnstakeModal}
        setShowUnstakeModal={setShowUnstakeModal}
        stakedAmount={stakedAmount}
      />

      <StakeLpModal
        showStakeModal={showStakeLp1Modal}
        setShowStakeModal={setShowStakeLp1Modal}
        apy={dikoLpApy}
        balanceName={'dikousda'}
        tokenName={'ARKV1DIKOUSDA'}
      />

      <StakeLpModal
        showStakeModal={showStakeLp2Modal}
        setShowStakeModal={setShowStakeLp2Modal}
        apy={stxLpApy}
        balanceName={'wstxusda'}
        tokenName={'ARKV1WSTXUSDA'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp1Modal}
        setShowUnstakeModal={setShowUnstakeLp1Modal}
        stakedAmount={lpDikoStakedAmount}
        balanceName={'dikousda'}
        tokenName={'ARKV1DIKOUSDA'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp2Modal}
        setShowUnstakeModal={setShowUnstakeLp2Modal}
        stakedAmount={lpStxStakedAmount}
        balanceName={'wstxusda'}
        tokenName={'ARKV1WSTXUSDA'}
      />

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
                      Stake your DIKO or LP tokens to earn rewards. For every DIKO/LP staked, <br/>
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
                          <tr className="bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                                </div>
                                <div className="ml-4">
                                  {microToReadable(lpDikoStakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ARKV1DIKOUSDA
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {dikoLpApy}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {microToReadable(lpDikoPendingRewards).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <button type="button" onClick={() => setShowStakeLp1Modal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Stake
                              </button>

                              <button type="button" onClick={() => setShowUnstakeLp1Modal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Unstake
                              </button>

                              <button type="button" onClick={() => claimDikoLpPendingRewards()} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Claim Rewards
                              </button>

                              <button type="button" onClick={() => stakeDikoLpPendingRewards()} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Stake Rewards
                              </button>
                            </td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                                </div>
                                <div className="ml-4">
                                  {microToReadable(lpStxStakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ARKV1WSTXUSDA
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {stxLpApy}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {microToReadable(lpStxPendingRewards).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <button type="button" onClick={() => setShowStakeLp2Modal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Stake
                              </button>

                              <button type="button" onClick={() => setShowUnstakeLp2Modal(true)} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Unstake
                              </button>

                              <button type="button" onClick={() => claimStxLpPendingRewards()} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Claim Rewards
                              </button>

                              <button type="button" onClick={() => stakeStxLpPendingRewards()} className="inline-flex items-right mr-4 px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Stake Rewards
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
