import React, { useContext, useEffect, useState } from 'react';
import { tokenList } from '@components/token-swap-list';
import { Disclosure } from '@headlessui/react';
import { Tooltip } from '@blockstack/ui';
import { Placeholder } from './ui/placeholder';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import { AppContext } from '@common/context';
import { stacksNetwork as network } from '@common/utils';
import { StakeModal } from './stake-modal';
import { AnchorMode, callReadOnlyFunction, contractPrincipalCV, createAssetInfo, cvToJSON, FungibleConditionCode, makeStandardFungiblePostCondition, standardPrincipalCV, uintCV } from '@stacks/transactions';

export interface StakeSectionLpRowProps {
  showLoadingState: boolean,
  lpToken: string,
  apiData: any,
  stakedAmount: number,
  rewardsPerBlock: number
}

export const StakeSectionLpRow: React.FC<StakeSectionLpRowProps> = ({ showLoadingState, lpToken, apiData, stakedAmount, rewardsPerBlock }) => {
  
  // Get info based on lpToken name
  let apiLpKey = "arkadiko-token/usda-token";
  let apiStakeKey = "arkv1dikousda";
  let stateLpKey = "dikousda";
  let ftContract = 'diko-usda'
  let decimalsTokenX = 1000000;
  if (lpToken == "arkadiko-swap-token-wstx-usda") {
    apiLpKey = "wrapped-stx-token/usda-token";
    apiStakeKey = "arkv1wstxusda";
    stateLpKey = "wstxusda";
    ftContract = 'wstx-usda'
    decimalsTokenX = 1000000;
  } else if (lpToken == "arkadiko-swap-token-xbtc-usda") {
    apiLpKey = "Wrapped-Bitcoin/usda-token";
    apiStakeKey = "arkv1xbtcusda";
    stateLpKey = "xbtcusda";
    ftContract = 'xbtc-usda'
    decimalsTokenX = 100000000;
  }

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------

  const [state, setState] = useContext(AppContext);
  const [loadingData, setLoadingData] = useState(true);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);

  const [tokenListX, setTokenListX] = useState(0);
  const [tokenListY, setTokenListY] = useState(0);
  const [lpRoute, setLpRoute] = useState("");

  const [walletLpAmount, setWalletLpAmount] = useState(0.0);
  const [walletTokenXAmount, setWalletTokenXAmount] = useState(0.0);
  const [walletTokenYAmount, setWalletTokenYAmount] = useState(0.0);
  const [walletValue, setWalletValue] = useState(0.0);

  const [stakedTokenXAmount, setStakedTokenXAmount] = useState(0.0);
  const [stakedTokenYAmount, setStakedTokenYAmount] = useState(0.0);
  const [stakedValue, setStakedValue] = useState(0.0);
  
  const [pendingRewards, setPendingRewards] = useState(0.0);
  const [apr, setApr] = useState(0.0);

  const stxAddress = useSTXAddress() || '';
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  // ---------------------------------------------------------
  // Get data
  // ---------------------------------------------------------


  const getPendingRewards = async (token: string) => {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'get-pending-rewards',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
        contractPrincipalCV(contractAddress, token),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    return cvToJSON(result).value.value / 1000000;
  };

  async function loadData() {

    // Calculate amounts and values
    const usdaPrice = Number(apiData.usda.last_price / 1000000);
    const dikoPrice = Number(apiData.diko.last_price / 1000000);

    const totalX = Number(apiData[apiLpKey]["balance_x"] / decimalsTokenX);
    const totalY = Number(apiData[apiLpKey]["balance_y"] / 1000000);
    const totalShares = Number(apiData[apiLpKey]["shares_total"] / 1000000);
    const totalStaked = Number(apiData[apiStakeKey]["total_staked"] / 1000000);
    const userBalance = Number(state.balance[stateLpKey] / 1000000);

    const userWalletShare = userBalance / totalShares;
    const userStakedShare = stakedAmount / totalShares;

    setWalletTokenXAmount(totalX * userWalletShare);
    setWalletTokenYAmount(totalY * userWalletShare);
    setWalletValue(totalY * userWalletShare * 2.0 * usdaPrice);

    setStakedTokenXAmount(totalX * userStakedShare);
    setStakedTokenYAmount(totalY * userStakedShare);
    setStakedValue(totalY * userStakedShare * 2.0 * usdaPrice);

    setPendingRewards(await getPendingRewards(lpToken));
    
    const totalStakedValue = totalY * (totalStaked / totalShares) * 2.0 * usdaPrice;
    const totalRewardValue = rewardsPerBlock * 144 * 365 * dikoPrice;
    setApr(Number((100 * (totalRewardValue / totalStakedValue)).toFixed(2)));

    setLoadingData(false);
  }

  function setup() {
    if (lpToken == "arkadiko-swap-token-diko-usda") {
      setTokenListX(1);
      setTokenListY(0);
      setLpRoute("/swap/add/DIKO/USDA");
      setWalletLpAmount(state.balance['dikousda'] / 1000000);

    } else if (lpToken == "arkadiko-swap-token-wstx-usda") {
      setTokenListX(2);
      setTokenListY(0);
      setLpRoute("/swap/add/STX/USDA");
      setWalletLpAmount(state.balance['wstxusda'] / 1000000);

    } else if (lpToken == "arkadiko-swap-token-xbtc-usda") {
      setTokenListX(3);
      setTokenListY(0);
      setLpRoute("/swap/add/xBTC/USDA");
      setWalletLpAmount(state.balance['xbtcusda'] / 1000000);
    }
  }

  useEffect(() => {
    setup();
    if (!showLoadingState) {
      loadData();
    }
  }, [state.balance, showLoadingState]);


  // ---------------------------------------------------------
  // Contract calls
  // ---------------------------------------------------------

  async function stake(amount: number) {
    const amountParam = uintCV(Number((amount * 1000000).toFixed(0)));
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        amountParam.value,
        createAssetInfo(contractAddress, lpToken, ftContract)
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, lpToken),
        amountParam
      ],
      postConditions,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowStakeModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function unstake(amount: number) {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'unstake',
      functionArgs: [
        contractPrincipalCV(contractAddress, lpToken),
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

  async function claimRewards() {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, lpToken),
      ],
      postConditionMode: 0x02,
      onFinish: data => {
        console.log('Broadcasted TX:', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowUnstakeModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  }

  async function stakeRewards() {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-lp-v2-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, "arkadiko-stake-pool-diko-v2-1"),
        contractPrincipalCV(contractAddress, "arkadiko-vest-esdiko-v1-1"),
        contractPrincipalCV(contractAddress, lpToken),
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


  // ---------------------------------------------------------
  // HTML
  // ---------------------------------------------------------

  return (
    <>
      <StakeModal
        key={"stake" + lpToken}
        type={'Stake'}
        showModal={showStakeModal}
        setShowModal={setShowStakeModal}
        tokenName={tokenList[tokenListX].name + "/" + tokenList[tokenListY].name + " LP"}
        logoX={tokenList[tokenListX].logo}
        logoY={tokenList[tokenListY].logo}
        apr={apr}
        max={state.balance[stateLpKey] / 1000000}
        callback={stake}
      />

      <StakeModal
        key={"unstake" + lpToken}
        type={'Unstake'}
        showModal={showUnstakeModal}
        setShowModal={setShowUnstakeModal}
        tokenName={tokenList[tokenListX].name + "/" + tokenList[tokenListY].name + " LP"}
        logoX={tokenList[tokenListX].logo}
        logoY={tokenList[tokenListY].logo}
        apr={apr}
        max={stakedAmount}
        callback={unstake}
      />

      <Disclosure as="tbody" className="bg-white dark:bg-zinc-800">
        {({ open }) => (
          <>
            <tr className="bg-white dark:bg-zinc-800">
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
                  <div className="flex -space-x-2 shrink-0">
                    <img
                      className="inline-block w-8 h-8 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                      src={tokenList[tokenListX].logo}
                      alt=""
                    />
                    <img
                      className="inline-block w-8 h-8 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                      src={tokenList[tokenListY].logo}
                      alt=""
                    />
                  </div>
                  <p className="mt-2 sm:mt-0 sm:ml-4">
                    <span className="block text-gray-500 dark:text-zinc-400">
                      {tokenList[tokenListX].name}/{tokenList[tokenListY].name}
                    </span>
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  `${apr}%`
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <>
                    <Tooltip
                      shouldWrapChildren={true}
                      label={`
                      ${walletTokenXAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} ${tokenList[tokenListX].name}
                      /
                      ${walletTokenYAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} ${tokenList[tokenListY].name}
                    `}
                    >
                      <div className="flex items-center">
                        <p className="font-semibold">
                          {walletLpAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{' '}
                          <span className="text-sm font-normal">LP</span>
                        </p>
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={5}
                          className="inline ml-2 text-gray-400"
                        />
                      </div>
                    </Tooltip>
                    <p className="mt-1 text-sm">
                      ≈$
                      {walletValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <>
                    <Tooltip
                      shouldWrapChildren={true}
                      label={`
                      ${stakedTokenXAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} ${tokenList[tokenListX].name}
                      /
                      ${stakedTokenYAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} ${tokenList[tokenListY].name}
                    `}
                    >
                      <div className="flex items-center">
                        <p className="font-semibold">
                          {stakedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{' '}
                          <span className="text-sm font-normal">LP</span>
                        </p>
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={5}
                          className="inline ml-2 text-gray-400"
                        />
                      </div>
                    </Tooltip>
                    <p className="mt-1 text-sm">
                      ≈$
                      {stakedValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                  </>
                )}
              </td>
              <td className="px-6 py-4 font-semibold whitespace-nowrap dark:text-white">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <>
                    {pendingRewards.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}{' '}
                    <span className="text-sm font-normal">esDIKO</span>
                  </>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                <Disclosure.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                  <span>Actions</span>
                  <StyledIcon
                    as="ChevronUpIcon"
                    size={5}
                    className={`${
                      open ? '' : 'transform rotate-180 transition ease-in-out duration-300'
                    } ml-2`}
                  />
                </Disclosure.Button>
              </td>
            </tr>
            <Disclosure.Panel as="tr" className="bg-gray-50 dark:bg-zinc-700">
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <RouterLink
                  to={lpRoute}
                  className={`inline-flex items-center px-4 py-2 text-sm leading-4 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    walletLpAmount > 0
                      ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {walletLpAmount > 0 ? `Add LP` : `Get LP`}
                </RouterLink>
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap" />
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={walletLpAmount == 0}
                    onClick={() => setShowStakeModal(true)}
                  >
                    Stake LP
                  </button>
                )}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                {loadingData ? (
                  <Placeholder className="py-2" width={Placeholder.width.HALF} />
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={stakedAmount == 0}
                    onClick={() => setShowUnstakeModal(true)}
                  >
                    Unstake LP
                  </button>
                )}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <div className="flex space-x-2">
                  {loadingData ? (
                    <Placeholder className="py-2" width={Placeholder.width.HALF} />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 text-sm leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        disabled={pendingRewards == 0}
                        onClick={() => claimRewards()}
                      >
                        Claim
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 text-sm leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        disabled={pendingRewards == 0}
                        onClick={() => stakeRewards()}
                      >
                        Stake
                      </button>
                    </>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap" />
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
};
