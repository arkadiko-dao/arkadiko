import React, { Fragment, useContext, useEffect, useState } from 'react';
import { tokenList } from '@components/token-swap-list';
import { Menu, Transition } from '@headlessui/react';
import { Placeholder } from './ui/placeholder';
import { Tooltip } from '@blockstack/ui';
import { StyledIcon } from './ui/styled-icon';
import { AppContext } from '@common/context';
import { blocksToTime, getRPCClient, stacksNetwork as network } from '@common/utils';
import { AnchorMode, callReadOnlyFunction, contractPrincipalCV, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { InputModal } from './input-modal';
import { useConnect } from '@stacks/connect-react';

export const StakeSectionDiko = ({ showLoadingState, apiData }) => {
  const [state, setState] = useContext(AppContext);

  const [loadingData, setLoadingData] = useState(true);
  const [showStakeDikoModal, setShowStakeDikoModal] = useState(false);
  const [showStakeEsDikoModal, setShowStakeEsDikoModal] = useState(false);
  const [showUnstakeDikoModal, setShowUnstakeDikoModal] = useState(false);
  const [showUnstakeEsDikoModal, setShowUnstakeEsDikoModal] = useState(false);

  const [walletDiko, setWalletDiko] = useState(0.0);
  const [walletEsDiko, setWalletEsDiko] = useState(0.0);
  const [stakedDiko, setStakedDiko] = useState(0.0);
  const [stakedEsDiko, setStakedEsDiko] = useState(0.0);
  const [stakedPoints, setStakedPoints] = useState(0.0);
  const [pendingRewardsUsda, setPendingRewardsUsda] = useState(0.0);
  const [pendingRewardsEsDiko, setPendingRewardsEsDiko] = useState(0.0);
  const [pendingRewardsPoints, setPendingRewardsPoints] = useState(0.0);
  const [aprEsDiko, setAprEsDiko] = useState(0.0);
  const [epochUsda, setEpochUsda] = useState(0.0);
  const [nextEpochUsda, setNextEpochUsda] = useState(0.0);
  const [epochBlocksLeft, setEpochBlocksLeft] = useState(0);

  const stxAddress = useSTXAddress() || '';
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const loadUserStaked = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'get-stake-of',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  };

  const loadUserPendingRewards = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'get-pending-rewards',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const loadRevenueInfo = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'get-revenue-info',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  };

  const loadRewardRate = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'get-esdiko-rewards-rate',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value / 1000000;
    return result;
  };

  const loadTotalStaked = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'get-total-staked',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value / 1000000;
    return result;
  };

  async function loadStakingRewardsPerBlock() {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-diko-guardian-v1-1',
      functionName: 'get-staking-rewards-per-block',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value / 1000000;
    return result;
  }

  const getCurrentBlockHeight = async () => {
    const client = getRPCClient();
    const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
    const data = await response.json();
    return data['stacks_tip_height'];
  };

  async function loadData() {
    const [
      dataUserStaked,
      dataUserPendingRewards,
      dataRevenueInfo,
      dataCurrentBlock,
      dataStakingRewardsBlock,
      dataRewardRate,
      dataTotalStaked
    ] = await Promise.all([
      loadUserStaked(),
      loadUserPendingRewards(),
      loadRevenueInfo(),
      getCurrentBlockHeight(),
      loadStakingRewardsPerBlock(),
      loadRewardRate(),
      loadTotalStaked()
    ]);

    setWalletDiko(state.balance.diko / 1000000)
    setWalletEsDiko(state.balance.esdiko / 1000000)

    setStakedDiko(Number(dataUserStaked.diko.value) / 1000000);
    setStakedEsDiko(Number(dataUserStaked.esdiko.value) / 1000000);
    setStakedPoints(Number(dataUserStaked.points.value) / 1000000);

    setPendingRewardsUsda(Number(dataUserPendingRewards.usda.value) / 1000000);
    setPendingRewardsEsDiko(Number(dataUserPendingRewards.esdiko.value) / 1000000);
    setPendingRewardsPoints(Number(dataUserPendingRewards.point.value) / 1000000);

    setEpochUsda(dataRevenueInfo["revenue-epoch-length"].value * dataRevenueInfo["revenue-block-rewards"].value / 1000000)
    setNextEpochUsda(dataRevenueInfo["revenue-next-total"].value / 1000000)
    setEpochBlocksLeft(dataRevenueInfo["revenue-epoch-end"].value - dataCurrentBlock)
    if (dataRevenueInfo["revenue-epoch-end"].value < dataCurrentBlock) {
      setEpochBlocksLeft(0);
    }

    const dikoPrice = apiData.diko.last_price / 1000000;
    const totalStakedValue = dataTotalStaked * dikoPrice;
    const totalRewardValue = dataStakingRewardsBlock * dataRewardRate * 144 * 365 * dikoPrice;
    setAprEsDiko(Number((100 * (totalRewardValue / totalStakedValue)).toFixed(2)));

    setLoadingData(false);
  }

  useEffect(() => {
    if (!showLoadingState) {
      loadData();
    }
  }, [showLoadingState]);

  async function stakeDiko(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, "arkadiko-token"),
        uintCV(Number((amount * 1000000).toFixed(0))),
        contractPrincipalCV(contractAddress, "arkadiko-vest-esdiko-v1-1"),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowStakeDikoModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function stakeEsDiko(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, "escrowed-diko-token"),
        uintCV(Number((amount * 1000000).toFixed(0))),
        contractPrincipalCV(contractAddress, "arkadiko-vest-esdiko-v1-1"),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowStakeEsDikoModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function unstakeDiko(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'unstake',
      functionArgs: [
        contractPrincipalCV(contractAddress, "arkadiko-token"),
        uintCV(Number((amount * 1000000).toFixed(0))),
        contractPrincipalCV(contractAddress, "arkadiko-vest-esdiko-v1-1"),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowUnstakeDikoModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function unstakeEsDiko(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'unstake',
      functionArgs: [
        contractPrincipalCV(contractAddress, "escrowed-diko-token"),
        uintCV(Number((amount * 1000000).toFixed(0))),
        contractPrincipalCV(contractAddress, "arkadiko-vest-esdiko-v1-1"),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowUnstakeEsDikoModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function claimPendingRewards() {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
      anchorMode: AnchorMode.Any,
    });
  }

  return (
    <>
      <InputModal
        key={"stake-diko"}
        showModal={showStakeDikoModal}
        setShowModal={setShowStakeDikoModal}
        logoX={tokenList[1].logo}
        logoY={tokenList[1].logo}
        tokenName={"DIKO"}
        title={"Stake DIKO"}
        subtitle={`Stake your DIKO tokens to earn rewards, including protocol revenue.`}
        buttonText={"Stake"}
        maxAmount={walletDiko}
        callback={stakeDiko}
      />
      <InputModal
        key={"stake-esdiko"}
        showModal={showStakeEsDikoModal}
        setShowModal={setShowStakeEsDikoModal}
        logoX={tokenList[1].logo}
        logoY={tokenList[1].logo}
        tokenName={"esDIKO"}
        title={"Stake esDIKO"}
        subtitle={`Stake your esDIKO tokens to earn rewards, including protocol revenue.`}
        buttonText={"Stake"}
        maxAmount={walletEsDiko}
        callback={stakeEsDiko}
      />
      <InputModal
        key={"unstake-diko"}
        showModal={showUnstakeDikoModal}
        setShowModal={setShowUnstakeDikoModal}
        logoX={tokenList[1].logo}
        logoY={tokenList[1].logo}
        tokenName={"DIKO"}
        title={"Unstake DIKO"}
        subtitle={`Unstake your DIKO tokens to get them back in your wallet.`}
        buttonText={"Unstake"}
        maxAmount={stakedDiko}
        callback={unstakeDiko}
      />
      <InputModal
        key={"unstake-esdiko"}
        showModal={showUnstakeEsDikoModal}
        setShowModal={setShowUnstakeEsDikoModal}
        logoX={tokenList[1].logo}
        logoY={tokenList[1].logo}
        tokenName={"esDIKO"}
        title={"Unstake esDIKO"}
        subtitle={`Unstake your DIKO tokens to get them back in your wallet.`}
        buttonText={"Unstake"}
        maxAmount={stakedEsDiko}
        callback={unstakeEsDiko}
      />

      <section>
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <div>
            <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
              DIKO, esDIKO and loDIKO
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Stake DIKO or esDIKO to get your share of the protocol revenue. Earn loDIKO points.
            </p>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
              <StyledIcon as="QuestionMarkCircleIcon" size={5} className="text-indigo-600" />
            </div>
            <a
              className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
              href="https://docs.arkadiko.finance/protocol/diko/security-module"
              target="_blank"
              rel="noopener noreferrer"
            >
              More about revenue share
              <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
            </a>
          </div>
        </header>

        <div className="mt-4">
          <div className="gap-4 md:grid md:grid-flow-col md:grid-col-3">
            <div className="mt-3 bg-white divide-y divide-gray-200 rounded-md shadow dark:divide-zinc-600 dark:bg-zinc-800 md:mt-0">
              <div className="flex items-center p-4 sm:px-6">
                <img className="w-6 h-6 mr-2 rounded-full shrink-0" src={tokenList[1].logo} alt="" />
                <p className="text-sm font-semibold leading-6 text-gray-500 dark:text-zinc-400">
                  DIKO
                </p>
              </div>
              {/* {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : ( */}
              <div className="px-4 sm:py-3 sm:px-6">
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      Staked
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      {stakedDiko.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} <span className="text-sm font-normal">DIKO</span>
                    </p>
                  </dd>
                </div>
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      Total staked in pool
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      0.00 <span className="text-sm font-normal">DIKO</span>
                    </p>
                  </dd>
                </div>
              </div>
              <div className="px-4 sm:py-3 sm:px-6">
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      APR
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      {aprEsDiko.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}{' '}<span className="text-sm font-normal">%</span>
                    </p>
                  </dd>
                </div>
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      Rewards
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      {pendingRewardsUsda.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} <span className="text-sm font-normal">USDA</span>
                    </p>
                  </dd>
                </div>
              </div>
              <div className="px-1 sm:py-3">
                <Menu as="div" className="relative flex items-center justify-end">
                  {({ open }) => (
                    <>
                      <Menu.Button className="inline-flex items-center justify-center px-4 py-2 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                        <span>Actions</span>
                        <StyledIcon
                          as="ChevronUpIcon"
                          size={4}
                          className={`${
                            open
                              ? ''
                              : 'transform rotate-180 transition ease-in-out duration-300'
                          } ml-2`}
                        />
                      </Menu.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="absolute top-0 z-10 w-48 mx-3 mt-6 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg dark:divide-gray-600 right-3 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          <div className="px-1 py-1">

                            {/* STAKE DIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!(walletDiko > 0)}
                                  onClick={() => setShowStakeDikoModal(true)}
                                >
                                  {!(walletDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any available DIKO to stake in your wallet.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Stake DIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Stake DIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* STAKE esDIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!(walletEsDiko > 0)}
                                  onClick={() => setShowStakeEsDikoModal(true)}
                                >
                                  {!(walletEsDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any available esDIKO to stake in your wallet.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Stake esDIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Stake esDIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* UNSTAKE DIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  onClick={() => setShowUnstakeDikoModal(true)}
                                  disabled={!(stakedDiko > 0)}
                                >
                                  {!(stakedDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any staked DIKO.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleUpIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Unstake DIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleUpIcon"
                                        size={5}
                                        className="mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Unstake DIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* UNSTAKE esDIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  onClick={() => setShowUnstakeEsDikoModal(true)}
                                  disabled={!(stakedEsDiko > 0)}
                                >
                                  {!(stakedEsDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any staked esDIKO.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleUpIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Unstake esDIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleUpIcon"
                                        size={5}
                                        className="mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Unstake esDIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </div>

              {/* )} */}
            </div>
            <div className="mt-3 bg-white divide-y divide-gray-200 rounded-md shadow dark:divide-zinc-600 dark:bg-zinc-800 md:mt-0">
              <div className="flex items-center p-4 sm:px-6">
                <img className="w-6 h-6 mr-2 rounded-full shrink-0" src={tokenList[1].logo} alt="" />
                <p className="text-sm font-semibold leading-6 text-gray-500 dark:text-zinc-400">
                  esDIKO
                </p>
              </div>
              {/* {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : ( */}
              <div className="px-4 sm:py-3 sm:px-6">
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      Staked
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      {stakedEsDiko.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} <span className="text-sm font-normal">esDIKO</span>
                    </p>
                  </dd>
                </div>
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      Total staked in pool
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      0.00 <span className="text-sm font-normal">DIKO</span>
                    </p>
                  </dd>
                </div>
              </div>
              <div className="px-4 sm:py-3 sm:px-6">
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      APR
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      {aprEsDiko.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}{' '}<span className="text-sm font-normal">%</span>
                    </p>
                  </dd>
                </div>
                <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                  <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                    <p className="leading-6 text-gray-500 dark:text-zinc-400">
                      Rewards
                    </p>
                  </dt>
                  <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                    <p className="text-base font-semibold leading-none">
                      {pendingRewardsEsDiko.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} <span className="text-sm font-normal">esDIKO</span>
                    </p>
                  </dd>
                </div>
              </div>

              <div className="px-1 sm:py-3">
                <Menu as="div" className="relative flex items-center justify-end">
                  {({ open }) => (
                    <>
                      <Menu.Button className="inline-flex items-center justify-center px-4 py-2 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                        <span>Actions</span>
                        <StyledIcon
                          as="ChevronUpIcon"
                          size={4}
                          className={`${
                            open
                              ? ''
                              : 'transform rotate-180 transition ease-in-out duration-300'
                          } ml-2`}
                        />
                      </Menu.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="absolute top-0 z-10 w-48 mx-3 mt-6 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg dark:divide-gray-600 right-3 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          <div className="px-1 py-1">

                            {/* STAKE DIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!(walletDiko > 0)}
                                  onClick={() => setShowStakeDikoModal(true)}
                                >
                                  {!(walletDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any available DIKO to stake in your wallet.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Stake DIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Stake DIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* STAKE esDIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!(walletEsDiko > 0)}
                                  onClick={() => setShowStakeEsDikoModal(true)}
                                >
                                  {!(walletEsDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any available esDIKO to stake in your wallet.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Stake esDIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Stake esDIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* UNSTAKE DIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  onClick={() => setShowUnstakeDikoModal(true)}
                                  disabled={!(stakedDiko > 0)}
                                >
                                  {!(stakedDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any staked DIKO.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleUpIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Unstake DIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleUpIcon"
                                        size={5}
                                        className="mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Unstake DIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* UNSTAKE esDIKO */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  onClick={() => setShowUnstakeEsDikoModal(true)}
                                  disabled={!(stakedEsDiko > 0)}
                                >
                                  {!(stakedEsDiko > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any staked esDIKO.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleUpIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Unstake esDIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleUpIcon"
                                        size={5}
                                        className="mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Unstake esDIKO
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </div>

              {/* )} */}
            </div>

            <div className="px-4 py-5 mt-3 space-y-3 text-white rounded-md shadow bg-gradient-to-b from-indigo-900 to-zinc-900 dark:bg-zinc-800 sm:p-6 md:mt-0">
              <p className="text-xs font-bold leading-6 uppercase text-indigo-50 dark:text-zinc-400 md:mb-1">
                Rewards info
              </p>
              {/* {loadingData ? (
                <Placeholder className="py-2" width={Placeholder.width.HALF} />
              ) : ( */}
                <div>

                  <div className="flex items-center">
                    <p className="text-3xl font-semibold dark:text-white">
                      {stakedPoints.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} <span className="text-sm font-normal">loDIKO</span>
                    </p>
                    <div className="mt-3">
                      <Tooltip
                        className="ml-2"
                        shouldWrapChildren={true}
                        label={`loDIKO are earned at 100% APR and receive rewards just like DIKO and esDIKO. Points are lost when unstaking.`}
                      >
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={4}
                          className="block ml-2 text-indigo-200"
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-3xl font-semibold dark:text-white">
                      {epochUsda.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} <span className="text-sm font-normal">USDA</span>
                    </p>
                    <div className="mt-3">
                      <Tooltip
                        className="ml-2"
                        shouldWrapChildren={true}
                        label={`The USDA revenue that is being distributed this epoch (= 7-day period).`}
                      >
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={4}
                          className="block ml-2 text-indigo-200"
                        />
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-center mt-2">
                    <p className="text-sm font-semibold dark:text-white">
                      <span className="font-normal text-indigo-100">Next epoch:</span>{' '}
                      {nextEpochUsda.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} USDA
                    </p>
                    <Tooltip
                      className="ml-2"
                      shouldWrapChildren={true}
                      label={`The USDA revenue that has been gathered during this epoch, which will be distributed next epoch.`}
                    >
                      <StyledIcon
                        as="InformationCircleIcon"
                        size={4}
                        className="block ml-2 text-indigo-200"
                      />
                    </Tooltip>
                  </div>

                  <div className="flex items-center mt-2">
                    <p className="text-sm font-semibold dark:text-white">
                      <span className="font-normal text-indigo-100">Epoch time remaining:</span>{' '}
                      {blocksToTime(epochBlocksLeft)}
                    </p>
                  </div>

                  <div className="flex items-center justify-end mt-4">
                    <button
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                      onClick={() => claimPendingRewards()}
                      disabled={!(pendingRewardsUsda > 0 || pendingRewardsEsDiko > 0 || pendingRewardsPoints > 0)}
                    >
                      {!(pendingRewardsUsda > 0 || pendingRewardsEsDiko > 0 || pendingRewardsPoints > 0) ? (
                        <Tooltip
                          placement="left"
                          className="mr-2"
                          label={`You don't have any rewards to claim.`}
                        >
                          Claim rewards
                        </Tooltip>
                      ) : (
                        `Claim rewards`
                      )}
                    </button>
                  </div>
                </div>
              {/* )} */}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
