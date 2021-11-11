import React, { Fragment, useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network, getRPCClient } from '@common/utils';
import {
  AnchorMode,
  callReadOnlyFunction,
  contractPrincipalCV,
  uintCV,
  cvToJSON,
  standardPrincipalCV,
} from '@stacks/transactions';
import { StakeDikoModal } from './stake-diko-modal';
import { UnstakeDikoModal } from './unstake-diko-modal';
import { StakeLpModal } from './stake-lp-modal';
import { UnstakeLpModal } from './unstake-lp-modal';
import { useSTXAddress } from '@common/use-stx-address';
import { microToReadable } from '@common/vault-utils';
import { getPrice } from '@common/get-price';
import { tokenList } from '@components/token-swap-list';
import { useConnect } from '@stacks/connect-react';
import { StakeLpRow } from './stake-lp-row';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  DotsVerticalIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/solid';
import { Placeholder } from './ui/placeholder';
import { Tooltip } from '@blockstack/ui';
import { Alert } from './ui/alert';

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
  const [dikoCooldown, setDikoCooldown] = useState('');
  const [canUnstake, setCanUnstake] = useState(false);
  const [cooldownRunning, setCooldownRunning] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hasUnstakedTokens, setHasUnstakedTokens] = useState(false);
  const [emissionsStarted, setEmissionsStarted] = useState(false);

  const [stxDikoPoolInfo, setStxDikoPoolInfo] = useState(0);
  const [stxUsdaPoolInfo, setStxUsdaPoolInfo] = useState(0);
  const [dikoUsdaPoolInfo, setDikoUsdaPoolInfo] = useState(0);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    let mounted = true;

    const checkUnstakedTokens = async () => {
      if (
        state.balance['dikousda'] > 0 ||
        state.balance['wstxusda'] > 0 ||
        state.balance['wstxdiko'] > 0
      ) {
        setHasUnstakedTokens(true);
      }
    };

    const fetchLpStakeAmount = async (poolContract: string) => {
      const stakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: poolContract,
        functionName: 'get-stake-amount-of',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      return cvToJSON(stakedCall).value;
    };

    const fetchLpPendingRewards = async (poolContract: string) => {
      const dikoUsdaPendingRewardsCall = await callReadOnlyFunction({
        contractAddress,
        contractName: poolContract,
        functionName: 'get-pending-rewards',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || ''),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      return cvToJSON(dikoUsdaPendingRewardsCall).value.value;
    };

    const fetchTotalStaked = async (poolContract: string) => {
      const totalStxDikoStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: poolContract,
        functionName: 'get-total-staked',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      return cvToJSON(totalStxDikoStakedCall).value / 1000000;
    };

    const lpTokenValue = async (
      poolContract: string,
      lpTokenStakedAmount: number,
      lpTokenWalletAmount: number
    ) => {
      if (lpTokenWalletAmount == undefined) {
        return;
      }

      let tokenXContract = 'arkadiko-token';
      let tokenYContract = 'usda-token';
      let tokenXName = 'DIKO';
      let tokenYName = 'USDA';
      if (poolContract == 'arkadiko-stake-pool-wstx-diko-v1-1') {
        tokenXContract = 'wrapped-stx-token';
        tokenYContract = 'arkadiko-token';
        tokenXName = 'STX';
        tokenYName = 'DIKO';
      } else if (poolContract == 'arkadiko-stake-pool-wstx-usda-v1-1') {
        tokenXContract = 'wrapped-stx-token';
        tokenYContract = 'usda-token';
        tokenXName = 'STX';
        tokenYName = 'USDA';
      }

      // Get pair details
      const pairDetailsCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-swap-v2-1",
        functionName: "get-pair-details",
        functionArgs: [
          contractPrincipalCV(contractAddress, tokenXContract),
          contractPrincipalCV(contractAddress, tokenYContract),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const pairDetails = cvToJSON(pairDetailsCall).value.value.value;

      if (!cvToJSON(pairDetailsCall)['success']) {
        return {
          tokenX: tokenXName,
          tokenY: tokenYName,
          stakedTokenXAmount: 0,
          stakedTokenYAmount: 0,
          stakedValue: 0,
          walletTokenXAmount: 0,
          walletTokenYAmount: 0,
          walletValue: 0,
        };
      }

      // Calculate user balance
      const balanceX = pairDetails['balance-x'].value;
      const balanceY = pairDetails['balance-y'].value;
      const totalTokens = pairDetails['shares-total'].value;

      const stakedShare = lpTokenStakedAmount / totalTokens;
      const stakedBalanceX = balanceX * stakedShare;
      const stakedBalanceY = balanceY * stakedShare;

      const walletShare = lpTokenWalletAmount / totalTokens;
      const walletBalanceX = balanceX * walletShare;
      const walletBalanceY = balanceY * walletShare;

      // Estimate value
      let estimatedValueStaked = 0;
      let estimatedValueWallet = 0;
      if (tokenXName == 'STX') {
        const stxPrice = await getPrice('STX');
        estimatedValueStaked = (stakedBalanceX / 1000000) * stxPrice;
        estimatedValueWallet = (walletBalanceX / 1000000) * stxPrice;
      } else if (tokenYName == 'STX') {
        const stxPrice = await getPrice('STX');
        estimatedValueStaked = (stakedBalanceY / 1000000) * stxPrice;
        estimatedValueWallet = (walletBalanceY / 1000000) * stxPrice;
      } else if (tokenXName == 'USDA') {
        const udsdaPrice = await getPrice('USDA');
        estimatedValueStaked = (stakedBalanceX / 1000000) * udsdaPrice;
        estimatedValueWallet = (walletBalanceX / 1000000) * udsdaPrice;
      } else if (tokenYName == 'USDA') {
        const udsdaPrice = await getPrice('USDA');
        estimatedValueStaked = (stakedBalanceY / 1000000) * udsdaPrice;
        estimatedValueWallet = (walletBalanceY / 1000000) * udsdaPrice;
      }

      return {
        tokenX: tokenXName,
        tokenY: tokenYName,
        stakedTokenXAmount: stakedBalanceX,
        stakedTokenYAmount: stakedBalanceY,
        stakedValue: estimatedValueStaked,
        walletTokenXAmount: walletBalanceX,
        walletTokenYAmount: walletBalanceY,
        walletValue: estimatedValueWallet,
      };
    };

    const getData = async () => {
      // Get current block height
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      const currentBlock = data['stacks_tip_height'];

      const stDikoSupplyCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'stdiko-token',
        functionName: 'get-total-supply',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const stDikoSupply = cvToJSON(stDikoSupplyCall).value.value;
      const userStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v1-1',
        functionName: 'get-stake-of',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || ''),
          uintCV(stDikoSupply),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const dikoStaked = cvToJSON(userStakedCall).value.value;

      setStakedAmount(dikoStaked);
      const dikoUsdaLpStaked = await fetchLpStakeAmount('arkadiko-stake-pool-diko-usda-v1-1');
      setLpDikoUsdaStakedAmount(dikoUsdaLpStaked);
      const stxUsdaLpStaked = await fetchLpStakeAmount('arkadiko-stake-pool-wstx-usda-v1-1');
      setLpStxUsdaStakedAmount(stxUsdaLpStaked);
      const stxDikoLpStaked = await fetchLpStakeAmount('arkadiko-stake-pool-wstx-diko-v1-1');
      setLpStxDikoStakedAmount(stxDikoLpStaked);

      const dikoUsdaLpValue = await lpTokenValue(
        'arkadiko-stake-pool-diko-usda-v1-1',
        dikoUsdaLpStaked,
        state.balance['dikousda']
      );
      setDikoUsdaPoolInfo(dikoUsdaLpValue);
      const stxUsdaLpValue = await lpTokenValue(
        'arkadiko-stake-pool-wstx-usda-v1-1',
        stxUsdaLpStaked,
        state.balance['wstxusda']
      );
      setStxUsdaPoolInfo(stxUsdaLpValue);
      const stxDikoLpValue = await lpTokenValue(
        'arkadiko-stake-pool-wstx-diko-v1-1',
        stxDikoLpStaked,
        state.balance['wstxdiko']
      );
      setStxDikoPoolInfo(stxDikoLpValue);

      // if (currentBlock < REWARDS_START_BLOCK_HEIGHT) {
      //   setLoadingData(false);
      //   return;
      // }
      setEmissionsStarted(true);

      const dikoUsdaLpPendingRewards = await fetchLpPendingRewards(
        'arkadiko-stake-pool-diko-usda-v1-1'
      );
      setLpDikoUsdaPendingRewards(dikoUsdaLpPendingRewards);
      const stxUsdaLpPendingRewards = await fetchLpPendingRewards(
        'arkadiko-stake-pool-wstx-usda-v1-1'
      );
      setLpStxUsdaPendingRewards(stxUsdaLpPendingRewards);
      const stxDikoLpPendingRewards = await fetchLpPendingRewards(
        'arkadiko-stake-pool-wstx-diko-v1-1'
      );
      setLpStxDikoPendingRewards(stxDikoLpPendingRewards);

      let totalDikoStaked = await fetchTotalStaked('arkadiko-stake-pool-diko-v1-1');
      let totalDikoUsdaStaked = await fetchTotalStaked('arkadiko-stake-pool-diko-usda-v1-1');
      let totalStxUsdaStaked = await fetchTotalStaked('arkadiko-stake-pool-wstx-usda-v1-1');
      let totalStxDikoStaked = await fetchTotalStaked('arkadiko-stake-pool-wstx-diko-v1-1');

      const totalStakingRewardsYear1 = 23500000;

      if (totalDikoStaked === 0) {
        totalDikoStaked = 10;
      }
      const dikoPoolRewards = totalStakingRewardsYear1 * 0.1;
      const dikoApr = dikoPoolRewards / totalDikoStaked;
      setApy(Number((100 * dikoApr).toFixed(2)));

      if (totalDikoUsdaStaked === 0) {
        totalDikoUsdaStaked = 10;
      }
      const dikoUsdaPoolRewards = totalStakingRewardsYear1 * 0.25;
      const dikoUsdaApr = dikoUsdaPoolRewards / totalDikoUsdaStaked;
      setDikoUsdaLpApy(Number((100 * dikoUsdaApr).toFixed(2)));

      if (totalStxUsdaStaked === 0) {
        totalStxUsdaStaked = 10;
      }
      const stxUsdaPoolRewards = totalStakingRewardsYear1 * 0.5;
      const stxUsdaApr = stxUsdaPoolRewards / totalStxUsdaStaked;
      setStxUsdaLpApy(Number((100 * stxUsdaApr).toFixed(2)));

      if (totalStxDikoStaked === 0) {
        totalStxDikoStaked = 10;
      }
      const stxDikoPoolRewards = totalStakingRewardsYear1 * 0.15;
      const stxDikoApr = stxDikoPoolRewards / totalStxDikoStaked;
      setStxDikoLpApy(Number((100 * stxDikoApr).toFixed(2)));

      const dikoCooldownInfo = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v1-1',
        functionName: 'get-cooldown-info-of',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const cooldownInfo = cvToJSON(dikoCooldownInfo).value;
      const redeemStartBlock = cooldownInfo['redeem-period-start-block']['value'];
      const redeemEndBlock = cooldownInfo['redeem-period-end-block']['value'];

      // Helper to create countdown text
      function blockDiffToTimeLeft(blockDiff: number) {
        const minDiff = blockDiff * 10;
        const days = Math.floor(minDiff / (60 * 24));
        const hours = Math.floor((minDiff % (60 * 24)) / 60);
        const minutes = Math.floor(minDiff % 60);
        let text = '';
        if (days != 0) {
          text += days + 'd ';
        }
        if (hours != 0) {
          text += hours + 'h ';
        }
        if (minutes != 0) {
          text += minutes + 'm ';
        }
        return text;
      }

      if (redeemEndBlock == 0 || redeemEndBlock < currentBlock) {
        setDikoCooldown('Not started');
      } else if (redeemStartBlock < currentBlock) {
        const blockDiff = redeemEndBlock - currentBlock;
        let text = blockDiffToTimeLeft(blockDiff);
        text += ' left to withdraw';
        setDikoCooldown(text);
        setCanUnstake(true);
      } else {
        const blockDiff = redeemStartBlock - currentBlock;
        let text = blockDiffToTimeLeft(blockDiff);
        text += ' left';
        setDikoCooldown(text);
        setCooldownRunning(true);
      }

      setLoadingData(false);
    };
    if (mounted) {
      void checkUnstakedTokens();
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, [state.balance]);

  const startDikoCooldown = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v1-1',
      functionName: 'start-cooldown',
      functionArgs: [],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-usda-v1-1'),
      ],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-usda-v1-1'),
      ],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-diko-v1-1'),
      ],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
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
        tokenName={'DIKO/USDA'}
      />

      <StakeLpModal
        showStakeModal={showStakeLp2Modal}
        setShowStakeModal={setShowStakeLp2Modal}
        apy={stxUsdaLpApy}
        balanceName={'wstxusda'}
        tokenName={'STX/USDA'}
      />

      <StakeLpModal
        showStakeModal={showStakeLp3Modal}
        setShowStakeModal={setShowStakeLp3Modal}
        apy={stxDikoLpApy}
        balanceName={'wstxdiko'}
        tokenName={'STX/DIKO'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp1Modal}
        setShowUnstakeModal={setShowUnstakeLp1Modal}
        stakedAmount={lpDikoUsdaStakedAmount}
        balanceName={'dikousda'}
        tokenName={'DIKO/USDA'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp2Modal}
        setShowUnstakeModal={setShowUnstakeLp2Modal}
        stakedAmount={lpStxUsdaStakedAmount}
        balanceName={'wstxusda'}
        tokenName={'STX/USDA'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp3Modal}
        setShowUnstakeModal={setShowUnstakeLp3Modal}
        stakedAmount={lpStxDikoStakedAmount}
        balanceName={'wstxdiko'}
        tokenName={'STX/DIKO'}
      />

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">
            {hasUnstakedTokens ? (
              <Alert title="Unstaked LP tokens">
                <p>👀 We noticed that your wallet contains LP Tokens that are not staked yet.</p>
                <p className="mt-1">
                  If you want to stake them, pick the appropriate token in the table below and hit
                  the <DotsVerticalIcon className="inline w-4 h-4" aria-hidden="true" /> icon to
                  open the actions menu and initiate staking.
                </p>
              </Alert>
            ) : null}
            <section>
              <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings">DIKO</h3>
                  <p className="max-w-3xl mt-2 text-sm text-gray-500">
                    When staking DIKO in the <span className="font-semibold">security module</span>{' '}
                    you get stDIKO in return. Both DIKO and stDIKO can be used to propose and vote
                    in governance.
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
                    <QuestionMarkCircleIcon
                      className="w-5 h-5 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <a
                    className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 border-transparent hover:border-indigo-300 hover:text-indigo-700"
                    href="https://docs.arkadiko.finance/protocol/diko/security-module"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More on the Security Module
                    <ExternalLinkIcon className="block w-3 h-3 ml-2" aria-hidden="true" />
                  </a>
                </div>
              </header>

              <div className="mt-4 bg-white divide-y divide-gray-200 shadow sm:rounded-md">
                <div className="px-4 py-5 space-y-6 divide-y divide-gray-200 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:items-center sm:grid-cols-4">
                    <div>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8">
                          <img className="w-8 h-8 rounded-full" src={tokenList[1].logo} alt="" />
                        </div>
                        <p className="ml-4 text-lg font-semibold">
                          {loadingData ? (
                            <span>Loading...</span>
                          ) : (
                            <>
                              {microToReadable(stakedAmount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              DIKO
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {loadingData ? (
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        ) : emissionsStarted ? (
                          `${apy}%`
                        ) : (
                          <span>Emissions not started</span>
                        )}
                      </p>
                      <p className="text-base font-normal leading-6 text-gray-500">Current APR</p>
                    </div>
                    <div>
                      {loadingData ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <p className="text-lg font-semibold">{dikoCooldown}</p>
                      )}
                      <p className="flex items-center text-base font-normal leading-6 text-gray-500">
                        Cooldown status
                        <Tooltip
                          className="ml-2"
                          shouldWrapChildren={true}
                          label={`The 10-day cooldown period is the time required prior to unstaking your tokens. Once it expires, there is a 2-day window to unstake your tokens.`}
                        >
                          <InformationCircleIcon
                            className="flex-shrink-0 block w-5 h-5 ml-2 text-gray-400"
                            aria-hidden="true"
                          />
                        </Tooltip>
                      </p>
                    </div>
                    <div>
                      {state.balance['diko'] > 0 ||
                      state.balance['stdiko'] > 0 ||
                      (stakedAmount && canUnstake) ? (
                        <Menu as="div" className="relative flex items-center justify-end">
                          {({ open }) => (
                            <>
                              <Menu.Button className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-white rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <span className="sr-only">Open options</span>
                                <DotsVerticalIcon className="w-5 h-5" aria-hidden="true" />
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
                                  className="absolute top-0 z-10 w-48 mx-3 mt-1 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg right-7 ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                  <div className="px-1 py-1">
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
                                              className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                              aria-hidden="true"
                                            />
                                            Stake
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ) : null}
                                    {state.balance['stdiko'] > 0 && !cooldownRunning ? (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            className={`${
                                              active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                            onClick={() => startDikoCooldown()}
                                          >
                                            <ClockIcon
                                              className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                              aria-hidden="true"
                                            />
                                            Start cooldown
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ) : null}
                                    {stakedAmount && canUnstake ? (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            className={`${
                                              active ? 'bg-indigo-500 text-white' : 'text-gray-900'
                                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                            onClick={() => setShowUnstakeModal(true)}
                                          >
                                            <ArrowCircleUpIcon
                                              className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                              aria-hidden="true"
                                            />
                                            Unstake
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ) : null}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </>
                          )}
                        </Menu>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <header className="pb-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 text-gray-900 font-headings">
                  Liquidity Provider Tokens
                </h3>
                <p className="max-w-3xl mt-2 text-sm text-gray-500">
                  Staking LP tokens allows you to earn further rewards. You might be more familiar
                  with the term “farming”.
                </p>
              </header>

              <div className="mt-4">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              LP Token
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Current APR
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Available
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Staked
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Rewards
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>

                        {/* Arkadiko V1 DIKO USDA LP Token */}
                        <StakeLpRow
                          loadingData={loadingData}
                          tokenListItemX={1}
                          tokenListItemY={0}
                          balance={state.balance['dikousda']}
                          pendingRewards={lpDikoUsdaPendingRewards}
                          stakedAmount={lpDikoUsdaStakedAmount}
                          apy={dikoUsdaLpApy}
                          emissionsStarted={emissionsStarted}
                          poolInfo={dikoUsdaPoolInfo}
                          setShowStakeLpModal={setShowStakeLp1Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp1Modal}
                          claimLpPendingRewards={claimDikoUsdaLpPendingRewards}
                          stakeLpPendingRewards={stakeDikoUsdaLpPendingRewards}
                          getLpRoute={'/swap/add/DIKO/USDA'}
                        />

                        {/* Arkadiko V1 STX USDA LP Token */}
                        <StakeLpRow
                          loadingData={loadingData}
                          tokenListItemX={2}
                          tokenListItemY={0}
                          balance={state.balance['wstxusda']}
                          pendingRewards={lpStxUsdaPendingRewards}
                          stakedAmount={lpStxUsdaStakedAmount}
                          apy={stxUsdaLpApy}
                          emissionsStarted={emissionsStarted}
                          poolInfo={stxUsdaPoolInfo}
                          setShowStakeLpModal={setShowStakeLp2Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp2Modal}
                          claimLpPendingRewards={claimStxUsdaLpPendingRewards}
                          stakeLpPendingRewards={stakeStxUsdaLpPendingRewards}
                          getLpRoute={'/swap/add/STX/USDA'}
                        />

                        {/* Arkadiko V1 STX DIKO LP Token */}
                        <StakeLpRow
                          loadingData={loadingData}
                          tokenListItemX={2}
                          tokenListItemY={1}
                          balance={state.balance['wstxdiko']}
                          pendingRewards={lpStxDikoPendingRewards}
                          stakedAmount={lpStxDikoStakedAmount}
                          apy={stxDikoLpApy}
                          emissionsStarted={emissionsStarted}
                          poolInfo={stxDikoPoolInfo}
                          setShowStakeLpModal={setShowStakeLp3Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp3Modal}
                          claimLpPendingRewards={claimStxDikoLpPendingRewards}
                          stakeLpPendingRewards={stakeStxDikoLpPendingRewards}
                          getLpRoute={'/swap/add/STX/DIKO'}
                        />
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
