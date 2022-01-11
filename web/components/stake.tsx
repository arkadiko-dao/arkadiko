import React, { Fragment, useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
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
import { tokenList } from '@components/token-swap-list';
import { useConnect } from '@stacks/connect-react';
import { StakeLpRow } from './stake-lp-row';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  ChevronUpIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/solid';
import { Placeholder } from './ui/placeholder';
import { Tooltip } from '@blockstack/ui';
import { Alert } from './ui/alert';
import axios from 'axios';

export const Stake = () => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showStakeLp1Modal, setShowStakeLp1Modal] = useState(false);
  const [showStakeLp2Modal, setShowStakeLp2Modal] = useState(false);
  const [showStakeLp3Modal, setShowStakeLp3Modal] = useState(false);
  const [showStakeLp4Modal, setShowStakeLp4Modal] = useState(false);
  const [showStakeLp5Modal, setShowStakeLp5Modal] = useState(false);
  const [showUnstakeLp1Modal, setShowUnstakeLp1Modal] = useState(false);
  const [showUnstakeLp2Modal, setShowUnstakeLp2Modal] = useState(false);
  const [showUnstakeLp3Modal, setShowUnstakeLp3Modal] = useState(false);
  const [showUnstakeLp4Modal, setShowUnstakeLp4Modal] = useState(false);
  const [showUnstakeLp5Modal, setShowUnstakeLp5Modal] = useState(false);
  const [loadingApy, setLoadingApy] = useState(true);
  const [apy, setApy] = useState(0);
  const [dikoUsdaLpApy, setDikoUsdaLpApy] = useState(0);
  const [stxUsdaLpApy, setStxUsdaLpApy] = useState(0);
  const [stxDikoLpApy, setStxDikoLpApy] = useState(0);
  const [stxXbtcLpApy, setStxXbtcLpApy] = useState(0);
  const [xbtcUsdaLpApy, setXbtcUsdaLpApy] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [lpDikoUsdaStakedAmount, setLpDikoUsdaStakedAmount] = useState(0);
  const [lpStxUsdaStakedAmount, setLpStxUsdaStakedAmount] = useState(0);
  const [lpStxDikoStakedAmount, setLpStxDikoStakedAmount] = useState(0);
  const [lpStxXbtcStakedAmount, setLpStxXbtcStakedAmount] = useState(0);
  const [lpXbtcUsdaStakedAmount, setLpXbtcUsdaStakedAmount] = useState(0);
  const [lpDikoUsdaPendingRewards, setLpDikoUsdaPendingRewards] = useState(0);
  const [lpStxUsdaPendingRewards, setLpStxUsdaPendingRewards] = useState(0);
  const [lpStxDikoPendingRewards, setLpStxDikoPendingRewards] = useState(0);
  const [lpStxXbtcPendingRewards, setLpStxXbtcPendingRewards] = useState(0);
  const [lpXbtcUsdaPendingRewards, setLpXbtcUsdaPendingRewards] = useState(0);
  const [dikoCooldown, setDikoCooldown] = useState('');
  const [canUnstake, setCanUnstake] = useState(false);
  const [cooldownRunning, setCooldownRunning] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hasUnstakedTokens, setHasUnstakedTokens] = useState(false);
  const [poolInfo, setPoolInfo] = useState({});
  const [stxDikoPoolInfo, setStxDikoPoolInfo] = useState(0);
  const [stxUsdaPoolInfo, setStxUsdaPoolInfo] = useState(0);
  const [dikoUsdaPoolInfo, setDikoUsdaPoolInfo] = useState(0);
  const [stxXbtcPoolInfo, setStxXbtcPoolInfo] = useState(0);
  const [xbtcUsdaPoolInfo, setXbtcUsdaPoolInfo] = useState(0);
  const [loadingDikoToStDiko, setLoadingDikoToStDiko] = useState(true);
  const [stDikoToDiko, setStDikoToDiko] = useState(0);
  const [dikoPrice, setDikoPrice] = useState(0);
  const [stxPrice, setStxPrice] = useState(0);
  const [usdaPrice, setUsdaPrice] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [stDikoSupply, setStDikoSupply] = useState(0);
  const [totalDikoStaked, setTotalDikoStaked] = useState(10);
  const [totalDikoUsdaStaked, setTotalDikoUsdaStaked] = useState(10);
  const [totalStxUsdaStaked, setTotalStxUsdaStaked] = useState(10);
  const [totalStxDikoStaked, setTotalStxDikoStaked] = useState(10);
  const [totalStxXbtcStaked, setTotalStxXbtcStaked] = useState(10);
  const [totalXbtcUsdaStaked, setTotalXbtcUsdaStaked] = useState(10);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    const fetchStakeData = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pages/stake`);
      const data = response.data;
      // pools
      let poolInfo = {};
      poolInfo['wrapped-stx-token/usda-token'] = data['wrapped-stx-token/usda-token'];
      poolInfo['arkadiko-token/usda-token'] = data['arkadiko-token/usda-token'];
      poolInfo['wrapped-stx-token/arkadiko-token'] = data['wrapped-stx-token/arkadiko-token'];
      poolInfo['wrapped-stx-token/Wrapped-Bitcoin'] = data['wrapped-stx-token/Wrapped-Bitcoin'];
      poolInfo['Wrapped-Bitcoin/usda-token'] = data['Wrapped-Bitcoin/usda-token'];
      setPoolInfo(poolInfo);

      // stake data
      setStDikoSupply(data.stdiko.total_supply);
      setTotalDikoStaked(data.diko.total_staked / 1000000);
      setTotalDikoUsdaStaked(data.arkv1dikousda.total_staked / 1000000);
      setTotalStxUsdaStaked(data.arkv1wstxusda.total_staked / 1000000);
      setTotalStxDikoStaked(data.arkv1wstxdiko.total_staked / 1000000);
      setTotalStxXbtcStaked(data.arkv1wstxxbtc.total_staked / 1000000);
      setTotalXbtcUsdaStaked(data.arkv1xbtcusda.total_staked / 1000000);
      setCurrentBlock(data.block_height);

      // prices
      setDikoPrice(data.diko.last_price);
      setStxPrice(data.wstx.last_price);
      setUsdaPrice(data.usda.last_price);
    };

    fetchStakeData();
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkUnstakedTokens = () => {
      if (
        state.balance['dikousda'] > 0 ||
        state.balance['wstxusda'] > 0 ||
        state.balance['wstxdiko'] > 0 ||
        state.balance['wstxxbtc'] > 0
      ) {
        setHasUnstakedTokens(true);
      }
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

    const lpTokenValue = async (
      poolContract: string,
      lpTokenStakedAmount: number,
      lpTokenWalletAmount: number
    ) => {
      let tokenXContract = 'arkadiko-token';
      let tokenYContract = 'usda-token';
      let tokenXName = 'DIKO';
      let tokenYName = 'USDA';
      let tokenXDecimals = 6;
      let tokenYDecimals = 6;
      if (poolContract === 'arkadiko-stake-pool-wstx-diko-v1-1') {
        tokenXContract = 'wrapped-stx-token';
        tokenYContract = 'arkadiko-token';
        tokenXName = 'STX';
        tokenYName = 'DIKO';
      } else if (poolContract === 'arkadiko-stake-pool-wstx-usda-v1-1') {
        tokenXContract = 'wrapped-stx-token';
        tokenYContract = 'usda-token';
        tokenXName = 'STX';
        tokenYName = 'USDA';
      } else if (poolContract == 'arkadiko-stake-pool-wstx-xbtc-v1-1') {
        tokenXContract = 'wrapped-stx-token';
        tokenYContract = 'Wrapped-Bitcoin';
        tokenXName = 'STX';
        tokenYName = 'xBTC';
        tokenYDecimals = 8;
      } else if (poolContract == 'arkadiko-stake-pool-xbtc-usda-v1-1') {
        tokenXContract = 'Wrapped-Bitcoin';
        tokenXDecimals = 8;
        tokenYContract = 'usda-token';
        tokenXName = 'xBTC';
        tokenYName = 'USDA';
      }

      // Get pair details
      const pairDetails = poolInfo[`${tokenXContract}/${tokenYContract}`];
      if (!pairDetails) {
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
      const balanceX = pairDetails['balance_x'];
      const balanceY = pairDetails['balance_y'];
      const totalTokens = pairDetails['shares_total'];
      const decimalRatioX = 1000000 / Math.pow(10, tokenXDecimals);
      const decimalRatioY = 1000000 / Math.pow(10, tokenYDecimals);

      const stakedShare = lpTokenStakedAmount / totalTokens;
      const stakedBalanceX = balanceX * stakedShare * decimalRatioX;
      const stakedBalanceY = balanceY * stakedShare * decimalRatioY;

      const walletShare = lpTokenWalletAmount / totalTokens;
      const walletBalanceX = balanceX * walletShare * decimalRatioX;
      const walletBalanceY = balanceY * walletShare * decimalRatioY;

      // Estimate value
      let estimatedValueStaked = 0;
      let estimatedValueWallet = 0;
      if (tokenXName == 'STX') {
        estimatedValueStaked = (stakedBalanceX / 1000000) * stxPrice * 2;
        estimatedValueWallet = (walletBalanceX / 1000000) * stxPrice * 2;
      } else if (tokenYName == 'STX') {
        estimatedValueStaked = (stakedBalanceY / 1000000) * stxPrice * 2;
        estimatedValueWallet = (walletBalanceY / 1000000) * stxPrice * 2;
      } else if (tokenXName == 'USDA') {
        estimatedValueStaked = (stakedBalanceX / 1000000) * usdaPrice * 2;
        estimatedValueWallet = (walletBalanceX / 1000000) * usdaPrice * 2;
      } else if (tokenYName == 'USDA') {
        estimatedValueStaked = (stakedBalanceY / 1000000) * usdaPrice * 2;
        estimatedValueWallet = (walletBalanceY / 1000000) * usdaPrice * 2;
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

    const getStakingData = async () => {
      const userStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-ui-stake-v1-3',
        functionName: 'get-stake-amounts',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const userStakedData = cvToJSON(userStakedCall).value.value;
      setLpDikoUsdaStakedAmount(userStakedData['stake-amount-diko-usda'].value);
      setLpStxUsdaStakedAmount(userStakedData['stake-amount-wstx-usda'].value);
      setLpStxDikoStakedAmount(userStakedData['stake-amount-wstx-diko'].value);

      return userStakedData;
    };

    const getXbtcStakingData = async () => {
      const xbtcStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-wstx-xbtc-v1-1',
        functionName: 'get-stake-amount-of',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const userXbtcStakedData = cvToJSON(xbtcStakedCall).value;
      setLpStxXbtcStakedAmount(userXbtcStakedData);

      return userXbtcStakedData;
    };

    const getXbtcUsdaStakingData = async () => {
      const xbtcUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-xbtc-usda-v1-1',
        functionName: 'get-stake-amount-of',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const userXbtcUsdaStakedData = cvToJSON(xbtcUsdaStakedCall).value;
      setLpXbtcUsdaStakedAmount(userXbtcUsdaStakedData);

      return userXbtcUsdaStakedData;
    };

    const getStakedDiko = async () => {
      const userStakedDikoCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v1-2',
        functionName: 'get-stake-of',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          standardPrincipalCV(stxAddress || ''),
          uintCV(stDikoSupply),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const userStakedDikoData = cvToJSON(userStakedDikoCall).value.value;
      setStakedAmount(userStakedDikoData);

      return userStakedDikoData;
    };

    const getDikoToStDiko = async () => {
      const stDikoToDikoCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v1-2',
        functionName: 'diko-for-stdiko',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
          uintCV(1000000 * 10),
          uintCV(stDikoSupply),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const stDikoToDiko = cvToJSON(stDikoToDikoCall).value.value / 10;
      setStDikoToDiko(Number(stDikoToDiko) / 1000000);
      setLoadingDikoToStDiko(false);

      return stDikoToDiko;
    };

    const getData = async () => {
      if (
        state.balance['dikousda'] == undefined ||
        state.balance['wstxusda'] == undefined ||
        state.balance['wstxdiko'] == undefined ||
        state.balance['wstxxbtc'] == undefined ||
        state.balance['xbtcusda'] == undefined ||
        stxPrice === 0 ||
        dikoPrice === 0 ||
        usdaPrice === 0 ||
        currentBlock === 0 ||
        stDikoSupply === 0
      ) {
        return;
      }

      const totalStakingRewardsYear1 = 23500000;
      const dikoPoolRewards = totalStakingRewardsYear1 * 0.1;
      const dikoApr = dikoPoolRewards / totalDikoStaked;
      setApy(Number((100 * dikoApr).toFixed(2)));

      const dikoDikoUsda = await lpTokenValue(
        'arkadiko-stake-pool-diko-usda-v1-1',
        0,
        totalDikoUsdaStaked
      );
      const dikoUsdaPoolRewards = totalStakingRewardsYear1 * 0.25;
      const dikoUsdaApr =
        dikoUsdaPoolRewards / (dikoDikoUsda['walletValue'] / Number(dikoPrice / 1000000));
      setDikoUsdaLpApy(Number((100 * dikoUsdaApr).toFixed(2)));

      const dikoStxUsda = await lpTokenValue(
        'arkadiko-stake-pool-wstx-usda-v1-1',
        0,
        totalStxUsdaStaked
      );
      const stxUsdaPoolRewards = totalStakingRewardsYear1 * 0.35;
      const stxUsdaApr =
        stxUsdaPoolRewards / (dikoStxUsda['walletValue'] / Number(dikoPrice / 1000000));
      setStxUsdaLpApy(Number((100 * stxUsdaApr).toFixed(2)));

      const dikoStxDiko = await lpTokenValue(
        'arkadiko-stake-pool-wstx-diko-v1-1',
        0,
        totalStxDikoStaked
      );
      const stxDikoPoolRewards = totalStakingRewardsYear1 * 0.15;
      const stxDikoApr =
        stxDikoPoolRewards / (dikoStxDiko['walletValue'] / Number(dikoPrice / 1000000));
      setStxDikoLpApy(Number((100 * stxDikoApr).toFixed(2)));

      const dikoStxXbtc = await lpTokenValue(
        'arkadiko-stake-pool-wstx-xbtc-v1-1',
        0,
        totalStxXbtcStaked
      );
      const stxXbtcPoolRewards = totalStakingRewardsYear1 * 0.05;
      const stxXbtcApr =
        stxXbtcPoolRewards / (dikoStxXbtc['walletValue'] / Number(dikoPrice / 1000000));
      setStxXbtcLpApy(Number((100 * stxXbtcApr).toFixed(2)));

      const dikoXbtcUsda = await lpTokenValue(
        'arkadiko-stake-pool-xbtc-usda-v1-1',
        0,
        totalXbtcUsdaStaked
      );
      const xbtcUsdaPoolRewards = totalStakingRewardsYear1 * 0.1;
      const xbtcUsdaApr =
        xbtcUsdaPoolRewards / (dikoXbtcUsda['walletValue'] / Number(dikoPrice / 1000000));
      setXbtcUsdaLpApy(Number((100 * xbtcUsdaApr).toFixed(2)));
      setLoadingApy(false);

      // User staked amounts
      const [_, userStakedData, userXbtcStakedData, userXbtcUsdaStakedData, stDiko] =
        await Promise.all([
          getStakedDiko(),
          getStakingData(),
          getXbtcStakingData(),
          getXbtcUsdaStakingData(),
          getDikoToStDiko(),
        ]);

      // LP value
      const [dikoUsdaLpValue, stxUsdaLpValue, stxDikoLpValue, stxXbtcLpValue, xbtcUsdaLpValue] =
        await Promise.all([
          lpTokenValue(
            'arkadiko-stake-pool-diko-usda-v1-1',
            userStakedData['stake-amount-diko-usda'].value,
            state.balance['dikousda']
          ),
          lpTokenValue(
            'arkadiko-stake-pool-wstx-usda-v1-1',
            userStakedData['stake-amount-wstx-usda'].value,
            state.balance['wstxusda']
          ),
          lpTokenValue(
            'arkadiko-stake-pool-wstx-diko-v1-1',
            userStakedData['stake-amount-wstx-diko'].value,
            state.balance['wstxdiko']
          ),
          lpTokenValue(
            'arkadiko-stake-pool-wstx-xbtc-v1-1',
            userXbtcStakedData,
            state.balance['wstxxbtc']
          ),
          lpTokenValue(
            'arkadiko-stake-pool-xbtc-usda-v1-1',
            userXbtcUsdaStakedData,
            state.balance['xbtcusda']
          ),
        ]);

      setDikoUsdaPoolInfo(dikoUsdaLpValue);
      setStxUsdaPoolInfo(stxUsdaLpValue);
      setStxDikoPoolInfo(stxDikoLpValue);
      setStxXbtcPoolInfo(stxXbtcLpValue);
      setXbtcUsdaPoolInfo(xbtcUsdaLpValue);

      // Pending rewards
      const [
        dikoUsdaLpPendingRewards,
        stxUsdaLpPendingRewards,
        stxDikoLpPendingRewards,
        stxXbtcLpPendingRewards,
        xbtcUsdaLpPendingRewards,
      ] = await Promise.all([
        fetchLpPendingRewards('arkadiko-stake-pool-diko-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-diko-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-xbtc-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-xbtc-usda-v1-1'),
      ]);

      setLpDikoUsdaPendingRewards(dikoUsdaLpPendingRewards);
      setLpStxUsdaPendingRewards(stxUsdaLpPendingRewards);
      setLpStxDikoPendingRewards(stxDikoLpPendingRewards);
      setLpStxXbtcPendingRewards(stxXbtcLpPendingRewards);
      setLpXbtcUsdaPendingRewards(xbtcUsdaLpPendingRewards);
      setLoadingData(false);

      const dikoCooldownInfo = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v1-2',
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
        let text = 'about 10 minutes';
        if (blockDiff > 0) {
          text = blockDiffToTimeLeft(blockDiff);
        }
        text += ' left';
        setDikoCooldown(text);
        setCooldownRunning(true);
      }
    };
    if (mounted) {
      void checkUnstakedTokens();
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, [state.balance, stxPrice, dikoPrice, usdaPrice]);

  const startDikoCooldown = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-diko-v1-2',
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-2'),
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

  const claimStxXbtcLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-xbtc-v1-1'),
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

  const stakeStxXbtcLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-xbtc-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-2'),
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

  const claimXbtcUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-xbtc-usda-v1-1'),
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

  const stakeXbtcUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-xbtc-usda-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-2'),
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-2'),
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
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v1-2'),
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
    <>
      <Helmet>
        <title>Stake</title>
      </Helmet>

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

      <StakeLpModal
        showStakeModal={showStakeLp4Modal}
        setShowStakeModal={setShowStakeLp4Modal}
        apy={stxXbtcLpApy}
        balanceName={'wstxxbtc'}
        tokenName={'STX/xBTC'}
      />

      <StakeLpModal
        showStakeModal={showStakeLp5Modal}
        setShowStakeModal={setShowStakeLp5Modal}
        apy={xbtcUsdaLpApy}
        balanceName={'xbtcusda'}
        tokenName={'xBTC/USDA'}
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

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp4Modal}
        setShowUnstakeModal={setShowUnstakeLp4Modal}
        stakedAmount={lpStxXbtcStakedAmount}
        balanceName={'wstxxbtc'}
        tokenName={'STX/xBTC'}
      />

      <UnstakeLpModal
        showUnstakeModal={showUnstakeLp5Modal}
        setShowUnstakeModal={setShowUnstakeLp5Modal}
        stakedAmount={lpXbtcUsdaStakedAmount}
        balanceName={'xbtcusda'}
        tokenName={'xBTC/USDA'}
      />

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">
            {hasUnstakedTokens ? (
              <Alert title="Unstaked LP tokens">
                <p>👀 We noticed that your wallet contains LP Tokens that are not staked yet.</p>
                <p className="mt-1">
                  If you want to stake them, pick the appropriate token in the table below, hit the
                  Actions dropdown button and choose Stake LP to initiate staking.
                </p>
              </Alert>
            ) : null}
            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    DIKO
                  </h3>
                  <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
                    When staking DIKO in the security module{' '}
                    <span className="font-semibold">you will receive stDIKO</span> which is a
                    representation of your share of the pool. DIKO in the pool is{' '}
                    <span className="font-semibold">auto-compounding</span>. Your amount of stDIKO{' '}
                    <span className="font-semibold">does not change</span>, but the DIKO value it
                    represents <span className="font-semibold">will increase</span>. Both DIKO and
                    stDIKO can be used to propose and vote in governance.
                  </p>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
                    <QuestionMarkCircleIcon
                      className="w-5 h-5 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <a
                    className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                    href="https://docs.arkadiko.finance/protocol/diko/security-module"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More on the Security Module
                    <ExternalLinkIcon className="block w-3 h-3 ml-2 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </header>

              <div className="mt-4 bg-white divide-y divide-gray-200 rounded-md shadow dark:divide-gray-600 dark:bg-zinc-900">
                <div className="px-4 py-5 space-y-6 divide-y divide-gray-200 dark:divide-zinc-600 sm:p-6">
                  <div className="md:grid md:grid-flow-col gap-4 sm:grid-cols-[min-content,auto]">
                    <div className="self-center w-14">
                      <img className="w-12 h-12 rounded-full" src={tokenList[1].logo} alt="" />
                    </div>
                    <div className="mt-3 md:mt-0">
                      <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                        stDIKO
                      </p>
                      {loadingDikoToStDiko ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <div>
                          <p className="text-lg font-semibold dark:text-white">
                            {microToReadable(state.balance['stdiko']).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </p>
                          <div className="flex items-center md:mt-1">
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                              1 stDIKO ≈{' '}
                              {stDikoToDiko.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              DIKO
                            </p>
                            <Tooltip
                              className="ml-2"
                              shouldWrapChildren={true}
                              label={`stDIKO's value is determined by dividing the total supply of DIKO in the pool by the total supply of stDIKO`}
                            >
                              <InformationCircleIcon
                                className="block w-4 h-4 ml-2 text-gray-400 shrink-0"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 md:mt-0">
                      <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                        DIKO
                      </p>
                      {loadingData ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <p className="text-lg font-semibold dark:text-white">
                          {microToReadable(stakedAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 md:mt-0">
                      <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                        Current APR
                      </p>
                      {loadingData ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <p className="text-indigo-600 dark:text-indigo-400">{apy}%</p>
                      )}
                    </div>
                    <div className="mt-3 md:mt-0">
                      <p className="flex items-center text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">
                        Cooldown status
                        <Tooltip
                          className="ml-2"
                          shouldWrapChildren={true}
                          label={`The 10-day cooldown period is the time required prior to unstaking your tokens. Once it expires, there is a 2-day window to unstake your tokens.`}
                        >
                          <InformationCircleIcon
                            className="block w-5 h-5 ml-2 text-gray-400 shrink-0"
                            aria-hidden="true"
                          />
                        </Tooltip>
                      </p>
                      {loadingData ? (
                        <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      ) : (
                        <p className="text-base dark:text-white">{dikoCooldown}</p>
                      )}
                    </div>
                    <div className="self-center">
                      <Menu as="div" className="relative flex items-center justify-end">
                        {({ open }) => (
                          <>
                            <Menu.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-900 dark:text-indigo-400">
                              <span>Actions</span>
                              <ChevronUpIcon
                                className={`${
                                  open
                                    ? ''
                                    : 'transform rotate-180 transition ease-in-out duration-300'
                                } ml-2 w-5 h-5`}
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
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active
                                            ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                            : 'text-gray-900'
                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                        disabled={!(state.balance['diko'] > 0)}
                                        onClick={() => setShowStakeModal(true)}
                                      >
                                        {!(state.balance['diko'] > 0) ? (
                                          <Tooltip
                                            placement="left"
                                            className="mr-2"
                                            label={`You don't have any available DIKO to stake in your wallet.`}
                                          >
                                            <div className="flex items-center w-full">
                                              <ArrowCircleDownIcon
                                                className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                                aria-hidden="true"
                                              />
                                              Stake
                                            </div>
                                          </Tooltip>
                                        ) : (
                                          <>
                                            <ArrowCircleDownIcon
                                              className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                              aria-hidden="true"
                                            />
                                            Stake
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </Menu.Item>

                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active
                                            ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                            : 'text-gray-900'
                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                        onClick={() => setShowUnstakeModal(true)}
                                        disabled={!(stakedAmount > 0 && canUnstake)}
                                      >
                                        {!(stakedAmount > 0) ? (
                                          <Tooltip
                                            placement="left"
                                            className="mr-2"
                                            label={`You don't have any staked DIKO.`}
                                          >
                                            <div className="flex items-center w-full">
                                              <ArrowCircleUpIcon
                                                className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                                aria-hidden="true"
                                              />
                                              Unstake
                                            </div>
                                          </Tooltip>
                                        ) : !canUnstake ? (
                                          <Tooltip
                                            placement="left"
                                            className="mr-2"
                                            label={`Either you haven't started the cooldown period, or the cooldown timer hasn't ended yet.`}
                                          >
                                            <div className="flex items-center w-full">
                                              <ArrowCircleUpIcon
                                                className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                                aria-hidden="true"
                                              />
                                              Unstake
                                            </div>
                                          </Tooltip>
                                        ) : (
                                          <>
                                            <ArrowCircleUpIcon
                                              className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                              aria-hidden="true"
                                            />
                                            Unstake
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </Menu.Item>

                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active
                                            ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                            : 'text-gray-900'
                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                        onClick={() => startDikoCooldown()}
                                        disabled={cooldownRunning}
                                      >
                                        {cooldownRunning ? (
                                          <Tooltip
                                            placement="left"
                                            className="mr-2"
                                            label={`Cooldown is already in progress.`}
                                          >
                                            <div className="flex items-center w-full">
                                              <ClockIcon
                                                className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                                aria-hidden="true"
                                              />
                                              Start cooldown
                                            </div>
                                          </Tooltip>
                                        ) : (
                                          <>
                                            <ClockIcon
                                              className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"
                                              aria-hidden="true"
                                            />
                                            Start cooldown
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

            <section className="relative mt-8 overflow-hidden">
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
                <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                  Liquidity Provider Tokens
                </h3>
                <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400 dark:text-zinc-300">
                  Staking LP tokens allows you to earn further rewards. You might be more familiar
                  with the term “farming”.
                </p>
              </header>

              <div className="flex flex-col mt-4">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-zinc-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                        <thead className="bg-gray-50 dark:bg-zinc-900 dark:bg-opacity-80">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              LP Token
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Current APR
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Available
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Staked
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Rewards
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>

                        {/* Arkadiko V1 DIKO USDA LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          tokenListItemX={1}
                          tokenListItemY={0}
                          balance={state.balance['dikousda']}
                          pendingRewards={lpDikoUsdaPendingRewards}
                          stakedAmount={lpDikoUsdaStakedAmount}
                          apy={dikoUsdaLpApy}
                          poolInfo={dikoUsdaPoolInfo}
                          setShowStakeLpModal={setShowStakeLp1Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp1Modal}
                          claimLpPendingRewards={claimDikoUsdaLpPendingRewards}
                          stakeLpPendingRewards={stakeDikoUsdaLpPendingRewards}
                          getLpRoute={'/swap/add/DIKO/USDA'}
                        />

                        {/* Arkadiko V1 STX USDA LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          tokenListItemX={2}
                          tokenListItemY={0}
                          balance={state.balance['wstxusda']}
                          pendingRewards={lpStxUsdaPendingRewards}
                          stakedAmount={lpStxUsdaStakedAmount}
                          apy={stxUsdaLpApy}
                          poolInfo={stxUsdaPoolInfo}
                          setShowStakeLpModal={setShowStakeLp2Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp2Modal}
                          claimLpPendingRewards={claimStxUsdaLpPendingRewards}
                          stakeLpPendingRewards={stakeStxUsdaLpPendingRewards}
                          getLpRoute={'/swap/add/STX/USDA'}
                        />

                        {/* Arkadiko V1 STX DIKO LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          tokenListItemX={2}
                          tokenListItemY={1}
                          balance={state.balance['wstxdiko']}
                          pendingRewards={lpStxDikoPendingRewards}
                          stakedAmount={lpStxDikoStakedAmount}
                          apy={stxDikoLpApy}
                          poolInfo={stxDikoPoolInfo}
                          setShowStakeLpModal={setShowStakeLp3Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp3Modal}
                          claimLpPendingRewards={claimStxDikoLpPendingRewards}
                          stakeLpPendingRewards={stakeStxDikoLpPendingRewards}
                          getLpRoute={'/swap/add/STX/DIKO'}
                        />

                        {/* Arkadiko V1 STX xBTC LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          tokenListItemX={2}
                          tokenListItemY={3}
                          balance={state.balance['wstxxbtc']}
                          pendingRewards={lpStxXbtcPendingRewards}
                          stakedAmount={lpStxXbtcStakedAmount}
                          apy={stxXbtcLpApy}
                          poolInfo={stxXbtcPoolInfo}
                          setShowStakeLpModal={setShowStakeLp4Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp4Modal}
                          claimLpPendingRewards={claimStxXbtcLpPendingRewards}
                          stakeLpPendingRewards={stakeStxXbtcLpPendingRewards}
                          getLpRoute={'/swap/add/STX/xBTC'}
                        />

                        {/* Arkadiko V1 xBTC USDA LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          tokenListItemX={3}
                          tokenListItemY={0}
                          balance={state.balance['xbtcusda']}
                          pendingRewards={lpXbtcUsdaPendingRewards}
                          stakedAmount={lpXbtcUsdaStakedAmount}
                          apy={xbtcUsdaLpApy}
                          poolInfo={xbtcUsdaPoolInfo}
                          setShowStakeLpModal={setShowStakeLp5Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp5Modal}
                          claimLpPendingRewards={claimXbtcUsdaLpPendingRewards}
                          stakeLpPendingRewards={stakeXbtcUsdaLpPendingRewards}
                          getLpRoute={'/swap/add/xBTC/USDA'}
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
    </>
  );
};
