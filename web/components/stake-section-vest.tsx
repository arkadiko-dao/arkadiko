import React, { useEffect, useState, Fragment, useContext } from 'react';
import { tokenList } from '@components/token-swap-list';
import { Placeholder } from './ui/placeholder';
import { StyledIcon } from './ui/styled-icon';
import { Menu, Transition } from '@headlessui/react';
import { AnchorMode, callReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { Tooltip } from '@blockstack/ui';
import { useConnect } from '@stacks/connect-react';
import { StakeModal } from './stake-modal';
import { AppContext } from '@common/context';

export const StakeSectionVest = ({ showLoadingState }) => {
  const [state, setState] = useContext(AppContext);

  const [loadingData, setLoadingData] = useState(true);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);

  const [walletAmount, setWalletAmount] = useState(0.0);
  const [vestingAmout, setVestingAmout] = useState(0.0);
  const [stakeAmount, setStakeAmount] = useState(0.0);
  const [claimableAmount, setClaimableAmount] = useState(0.0);
  const [reqStaked, setReqStaked] = useState(0.0);

  const stxAddress = useSTXAddress() || '';
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  
  const loadUserVesting = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-vest-esdiko-v1-1',
      functionName: 'get-vesting-of',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  };

  const loadRequiredStakedDiko = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-vest-esdiko-v1-1',
      functionName: 'get-req-staked-diko',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  };
  
  async function loadData() {
    const [
      dataUserVesting,
      dataRequiredStakedDiko
    ] = await Promise.all([
      loadUserVesting(),
      loadRequiredStakedDiko()
    ]);

    setWalletAmount(state.balance.esdiko / 1000000);
    setVestingAmout(Number(dataUserVesting["vesting-amount"].value) / 1000000);
    setStakeAmount(Number(dataUserVesting["stake-amount"].value) / 1000000)
    setClaimableAmount(Number(dataUserVesting.claimable.value) / 1000000);
    setReqStaked(Number(dataRequiredStakedDiko) / 1000000);
    setLoadingData(false);
  }

  useEffect(() => {
    if (!showLoadingState) {
      loadData();
    }
  }, [showLoadingState]);

  async function startVesting(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-vest-esdiko-v1-1',
      functionName: 'start-vesting',
      functionArgs: [
        uintCV(Number((amount * 1000000).toFixed(0)))
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowStakeModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function stopVesting(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-vest-esdiko-v1-1',
      functionName: 'end-vesting',
      functionArgs: [
        uintCV(Number((amount * 1000000).toFixed(0)))
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowUnstakeModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function claimDiko() {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-vest-esdiko-v1-1',
      functionName: 'claim-diko',
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
    <StakeModal
        key={"stake-esdiko"}
        type={'Stake'}
        showModal={showStakeModal}
        setShowModal={setShowStakeModal}
        tokenName={"esDIKO"}
        logoX={tokenList[1].logo}
        logoY={tokenList[1].logo}
        apr={0}
        max={walletAmount}
        callback={startVesting}
      />
      <StakeModal
        key={"unstake-esdiko"}
        type={'Unstake'}
        showModal={showUnstakeModal}
        setShowModal={setShowUnstakeModal}
        tokenName={"esDIKO"}
        logoX={tokenList[1].logo}
        logoY={tokenList[1].logo}
        apr={0}
        max={vestingAmout}
        callback={stopVesting}
      />
      <section className="relative mt-8">
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <div>
            <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Vest esDIKO
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              If you do not wish to stake esDIKO to receive rewards, you can linearly vest your esDIKO here over a period of 1 year.
              You need x% of DIKO/esDIKO staked in order to vest all esDIKO.
            </p>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
              <StyledIcon as="QuestionMarkCircleIcon" size={5} className="text-indigo-600" />
            </div>
            <a
              className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
              href="https://docs.arkadiko.finance/protocol/auctions/liquidation-pool"
              target="_blank"
              rel="noopener noreferrer"
            >
              More on esDIKO vesting
              <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
            </a>
          </div>
        </header>

        <div className="mt-4 bg-white divide-y divide-gray-200 rounded-md shadow dark:divide-gray-600 dark:bg-zinc-800">
          <div className="px-4 py-5 space-y-6 divide-y divide-gray-200 dark:divide-zinc-600 sm:p-6">
            <div className="md:grid md:grid-flow-col gap-4 sm:grid-cols-[min-content,auto]">
              <div className="self-center w-14">
                <img className="w-12 h-12 rounded-full" src={tokenList[0].logo} alt="" />
              </div>

              {/* VESTING */}
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  esDIKO vesting
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <div>
                    <p className="text-lg font-semibold dark:text-white">
                      {vestingAmout.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* CLAIMABLE */}
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  Vested DIKO tokens
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <div>
                    <p className="text-lg font-semibold dark:text-white">
                      {claimableAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* STAKING */}
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                  Staking
                </p>
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <div>
                    <p className="text-lg font-semibold dark:text-white">
                      {stakeAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                      /
                      {(vestingAmout * reqStaked).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* ACTION */}
              <div className="self-center text-right">
                <Menu as="div" className="relative flex items-center justify-end">
                  {({ open }) => (
                    <>
                      <Menu.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
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

                            {/* START */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!(walletAmount > 0)}
                                  onClick={() => setShowStakeModal(true)}
                                >
                                  {!(walletAmount > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any available esDIKO to vest in your wallet.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Start vesting
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Start vesting
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* STOP */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!(vestingAmout > 0)}
                                  onClick={() => setShowUnstakeModal(true)}
                                >
                                  {!(vestingAmout > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any esDIKO currently vesting.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Stop vesting
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400 group-hover:text-white"
                                      />
                                        Stop vesting
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            {/* CLAIM */}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  onClick={() => claimDiko()}
                                  disabled={!(claimableAmount > 0)}
                                >
                                  {!(claimableAmount > 0) ? (
                                    <Tooltip
                                      placement="left"
                                      className="mr-2"
                                      label={`You don't have any vested DIKO to claim.`}
                                    >
                                      <div className="flex items-center w-full">
                                        <StyledIcon
                                          as="ArrowCircleRightIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Get vested DIKO
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleRightIcon"
                                        size={5}
                                        className="mr-3 text-gray-400 group-hover:text-white"
                                      />
                                      Get vested DIKO
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

            </div>
          </div>
        </div>
      </section>
    </>
  );
};
