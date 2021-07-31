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
import { StakeActions } from './stake-actions';
import { Menu } from '@headlessui/react';
import { ArrowCircleDownIcon, ArrowCircleUpIcon, CashIcon, PlusIcon, ClockIcon } from '@heroicons/react/solid';
import { PlaceHolder } from './placeholder';

export const Stake = () => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showStakeLp1Modal, setShowStakeLp1Modal] = useState(false);
  const [showStakeLp2Modal, setShowStakeLp2Modal] = useState(false);
  const [showStakeLp3Modal, setShowStakeLp3Modal] = useState(false);
  const [showUnstakeLp1Modal, setShowUnstakeLp1Modal] = useState(false);
  const [showUnstakeLp2Modal, setShowUnstakeLp2Modal] = useState(false);
  const [showUnstakeLp3Modal, setShowUnstakeLp3Modal] = useState(false);
  const [apy, setApy] = useState(0);
  const [dikoUsdaLpApy, setDikoUsdaLpApy] = useState(0);
  const [stxUsdaLpApy, setStxUsdaLpApy] = useState(0);
  const [stxDikoLpApy, setStxDikoLpApy] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [lpDikoUsdaStakedAmount, setLpDikoUsdaStakedAmount] = useState(0);
  const [lpStxUsdaStakedAmount, setLpStxUsdaStakedAmount] = useState(0);
  const [lpStxDikoStakedAmount, setLpStxDikoStakedAmount] = useState(0);
  const [lpDikoUsdaPendingRewards, setLpDikoUsdaPendingRewards] = useState(0);
  const [lpStxUsdaPendingRewards, setLpStxUsdaPendingRewards] = useState(0);
  const [lpStxDikoPendingRewards, setLpStxDikoPendingRewards] = useState(0);
  const [dikoCooldown, setDikoCooldown] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
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

      const userLpDikoUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-usda-v1-1",
        functionName: "get-stake-amount-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let dikoUsdaLpStaked = cvToJSON(userLpDikoUsdaStakedCall).value;
      setLpDikoUsdaStakedAmount(dikoUsdaLpStaked);

      const userLpStxUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-usda-v1-1",
        functionName: "get-stake-amount-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let stxUsdaLpStaked = cvToJSON(userLpStxUsdaStakedCall).value;
      setLpStxUsdaStakedAmount(stxUsdaLpStaked);

      const userLpStxDikoStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-diko-v1-1",
        functionName: "get-stake-amount-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let stxDikoLpStaked = cvToJSON(userLpStxDikoStakedCall).value;
      setLpStxDikoStakedAmount(stxDikoLpStaked);

      const dikoUsdaPendingRewardsCall = await callReadOnlyFunction({
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
      let dikoUsdaLpPendingRewards = cvToJSON(dikoUsdaPendingRewardsCall).value.value;
      setLpDikoUsdaPendingRewards(dikoUsdaLpPendingRewards);

      const stxUsdaPendingRewardsCall = await callReadOnlyFunction({
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
      let stxUsdaLpPendingRewards = cvToJSON(stxUsdaPendingRewardsCall).value.value;
      setLpStxUsdaPendingRewards(stxUsdaLpPendingRewards);

      const stxDikoPendingRewardsCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-diko-v1-1",
        functionName: "get-pending-rewards",
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let stxDikoLpPendingRewards = cvToJSON(stxDikoPendingRewardsCall).value.value;
      setLpStxDikoPendingRewards(stxDikoLpPendingRewards);


      const totalDikoStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-v1-1",
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      let totalDikoStaked = cvToJSON(totalDikoStakedCall).value / 1000000;

      const totalDikoUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-usda-v1-1",
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      let totalDikoUsdaStaked = cvToJSON(totalDikoUsdaStakedCall).value / 1000000;

      const totalStxUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-usda-v1-1",
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      let totalStxUsdaStaked = cvToJSON(totalStxUsdaStakedCall).value / 1000000;

      const totalStxDikoStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-wstx-diko-v1-1",
        functionName: "get-total-staked",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      let totalStxDikoStaked = cvToJSON(totalStxDikoStakedCall).value / 1000000;

      const totalStakingRewardsYear1 = 23500000;

      if (totalDikoStaked === 0) { totalDikoStaked = 10 };
      const dikoPoolRewards = totalStakingRewardsYear1 * 0.1;
      const dikoApr = dikoPoolRewards / totalDikoStaked;
      setApy(Number((100 * dikoApr).toFixed(2)));

      if (totalDikoUsdaStaked === 0) { totalDikoUsdaStaked = 10 };
      const dikoUsdaPoolRewards = totalStakingRewardsYear1 * 0.2;
      const dikoUsdaApr = dikoUsdaPoolRewards / totalDikoUsdaStaked;
      setDikoUsdaLpApy(Number((100 * dikoUsdaApr).toFixed(2)));

      if (totalStxUsdaStaked === 0) { totalStxUsdaStaked = 10 };
      const stxUsdaPoolRewards = totalStakingRewardsYear1 * 0.5;
      const stxUsdaApr = stxUsdaPoolRewards / totalStxUsdaStaked;
      setStxUsdaLpApy(Number((100 * stxUsdaApr).toFixed(2)));

      if (totalStxDikoStaked === 0) { totalStxDikoStaked = 10 };
      const stxDikoPoolRewards = totalStakingRewardsYear1 * 0.2;
      const stxDikoApr = stxDikoPoolRewards / totalStxDikoStaked;
      setStxDikoLpApy(Number((100 * stxDikoApr).toFixed(2)));


      const dikoCooldownInfo = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-stake-pool-diko-v1-1",
        functionName: "get-cooldown-info-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      let cooldownInfo = cvToJSON(dikoCooldownInfo).value;
      let redeemStartBlock = cooldownInfo["redeem-period-start-block"]["value"];
      let redeemEndBlock = cooldownInfo["redeem-period-end-block"]["value"];

      // TODO
      let currentBlock = 1464;

      // Helper to create countdown text
      function blockDiffToTimeLeft(blockDiff) {
        let minDiff = (blockDiff * 10);
        let days = Math.floor(minDiff / (60 * 24));
        let hours = Math.floor((minDiff % (60 * 24)) / 60);
        let minutes = Math.floor(minDiff % (60));
        var text = "";
        if (days != 0) { text += days + "d "; }
        if (hours != 0) { text += hours + "h "; }
        if (minutes != 0) { text += minutes + "m "; }
        return text;
      }
  
      if (redeemEndBlock == 0 || redeemEndBlock < currentBlock) {
        setDikoCooldown("Not started");
      } else if (redeemStartBlock < currentBlock) {
        let blockDiff = redeemEndBlock - currentBlock;
        var text = blockDiffToTimeLeft(blockDiff);
        text += " left to withdraw"
        setDikoCooldown(text);
      } else {
        let blockDiff = redeemStartBlock - currentBlock;
        var text = blockDiffToTimeLeft(blockDiff);
        text += " left"
        setDikoCooldown(text);
      }

      setLoadingData(false);
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, [state.balance]);

  const startDikoCooldown = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v1-1',
      functionName: 'start-cooldown',
      functionArgs: [],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const claimDikoUsdaLpPendingRewards = async () => {
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

  const claimStxUsdaLpPendingRewards = async () => {
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

  const claimStxDikoLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-diko-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const stakeDikoUsdaLpPendingRewards = async () => {
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

  const stakeStxUsdaLpPendingRewards = async () => {
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

  const stakeStxDikoLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-diko-v1-1'),
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
        apy={dikoUsdaLpApy}
        balanceName={'dikousda'}
        tokenName={'ARKV1DIKOUSDA'}
      />

      <StakeLpModal
        showStakeModal={showStakeLp2Modal}
        setShowStakeModal={setShowStakeLp2Modal}
        apy={stxUsdaLpApy}
        balanceName={'wstxusda'}
        tokenName={'ARKV1WSTXUSDA'}
      />

      <StakeLpModal
        showStakeModal={showStakeLp3Modal}
        setShowStakeModal={setShowStakeLp3Modal}
        apy={stxDikoLpApy}
        balanceName={'wstxdiko'}
        tokenName={'ARKV1WSTXDIKO'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp1Modal}
        setShowUnstakeModal={setShowUnstakeLp1Modal}
        stakedAmount={lpDikoUsdaStakedAmount}
        balanceName={'dikousda'}
        tokenName={'ARKV1DIKOUSDA'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp2Modal}
        setShowUnstakeModal={setShowUnstakeLp2Modal}
        stakedAmount={lpStxUsdaStakedAmount}
        balanceName={'wstxusda'}
        tokenName={'ARKV1WSTXUSDA'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp3Modal}
        setShowUnstakeModal={setShowUnstakeLp3Modal}
        stakedAmount={lpStxDikoStakedAmount}
        balanceName={'wstxdiko'}
        tokenName={'ARKV1WSTXDIKO'}
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
                      Stake your DIKO or LP tokens to earn rewards. When staking DIKO you get 
                      stDIKO in return which can be used to vote in governance.
                    </p>
                  </div>
                </div>
              </header>

              <div className="flex flex-col mt-8">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="overflow-hidden sm:rounded-lg pb-24">
                      <table className="sm:rounded-lg min-w-full divide-y divide-gray-200 border border-gray-200 shadow-sm">
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
                              Cooldown
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {loadingData ? (
                                <PlaceHolder size={2} color="indigo" />
                              ) : (
                                `${dikoCooldown}`
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {loadingData ? (
                                <PlaceHolder size={2} color="indigo" />
                              ) : (
                                `${apy}%`
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              auto-compounding
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {state.balance['diko'] > 0 || stakedAmount ? (
                                <StakeActions>
                                  {state.balance['diko'] > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowStakeModal(true)}
                                        >
                                          <ArrowCircleDownIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake
                                        </button>
                                      )}
                                    </Menu.Item>
                                    
                                  ) : null }
                                  {state.balance['diko'] > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => startDikoCooldown()}
                                        >
                                          <ClockIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Start cooldown
                                        </button>
                                      )}
                                    </Menu.Item>
                                    
                                  ) : null }
                                  {stakedAmount ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowUnstakeModal(true)}
                                        >
                                          <ArrowCircleUpIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Unstake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null}
                                </StakeActions>
                              ) : null }
                            </td>
                          </tr>

                          <tr className="bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                                </div>
                                <div className="ml-4">
                                  {microToReadable(lpDikoUsdaStakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ARKV1DIKOUSDA
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              N/A
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {loadingData ? (
                                <PlaceHolder size={2} color="indigo" />
                              ) : (
                                `${dikoUsdaLpApy}%`
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {microToReadable(lpDikoUsdaPendingRewards).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {state.balance['dikousda'] > 0 || lpDikoUsdaStakedAmount || lpDikoUsdaPendingRewards ? (
                                <StakeActions>
                                  {state.balance['dikousda'] > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowStakeLp1Modal(true)}
                                        >
                                          <ArrowCircleDownIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpDikoUsdaStakedAmount > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowUnstakeLp1Modal(true)}
                                        >
                                          <ArrowCircleUpIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Unstake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpDikoUsdaPendingRewards > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => claimDikoUsdaLpPendingRewards()}
                                        >
                                          <CashIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Claim Rewards
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpDikoUsdaPendingRewards > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => stakeDikoUsdaLpPendingRewards()}
                                        >
                                          <PlusIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake Rewards
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                </StakeActions>
                              ) : null }
                            </td>
                          </tr>

                          <tr className="bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                                </div>
                                <div className="ml-4">
                                  {microToReadable(lpStxUsdaStakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ARKV1WSTXUSDA
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              N/A
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {loadingData ? (
                                <PlaceHolder size={2} color="indigo" />
                              ) : (
                                `${stxUsdaLpApy}%`
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {microToReadable(lpStxUsdaPendingRewards).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {state.balance['wstxusda'] > 0 || lpStxUsdaStakedAmount || lpStxUsdaPendingRewards ? (
                                <StakeActions>
                                  {state.balance['wstxusda'] > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowStakeLp2Modal(true)}
                                        >
                                          <ArrowCircleDownIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpStxUsdaStakedAmount > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowUnstakeLp2Modal(true)}
                                        >
                                          <ArrowCircleUpIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Unstake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpStxUsdaPendingRewards > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => claimStxUsdaLpPendingRewards()}
                                        >
                                          <CashIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Claim Rewards
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpStxUsdaPendingRewards > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => stakeStxUsdaLpPendingRewards()}
                                        >
                                          <PlusIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake Rewards
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                </StakeActions>
                              ) : null }
                            </td>
                          </tr>

                          <tr className="bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
                                </div>
                                <div className="ml-4">
                                  {microToReadable(lpStxDikoStakedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ARKV1WSTXDIKO
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              N/A
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                              {loadingData ? (
                                <PlaceHolder size={2} color="indigo" />
                              ) : (
                                `${stxDikoLpApy}%`
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {microToReadable(lpStxDikoPendingRewards).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {state.balance['wstxdiko'] > 0 || lpStxDikoStakedAmount || lpStxDikoPendingRewards ? (
                                <StakeActions>
                                  {state.balance['wstxdiko'] > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowStakeLp3Modal(true)}
                                        >
                                          <ArrowCircleDownIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpStxDikoStakedAmount > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setShowUnstakeLp3Modal(true)}
                                        >
                                          <ArrowCircleUpIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Unstake
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpStxDikoPendingRewards > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => claimStxDikoLpPendingRewards()}
                                        >
                                          <CashIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Claim Rewards
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                  {lpStxDikoPendingRewards > 0 ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => stakeStxDikoLpPendingRewards()}
                                        >
                                          <PlusIcon
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white"
                                            aria-hidden="true"
                                          />
                                          Stake Rewards
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null }
                                </StakeActions>
                              ) : null }
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
