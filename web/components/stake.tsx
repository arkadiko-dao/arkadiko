import React, { useEffect, useContext, useState } from 'react';
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
import { useConnect } from '@stacks/connect-react';
import { StakeLpRow } from './stake-lp-row';
import { Alert } from './ui/alert';
import axios from 'axios';
import { StakeDikoSection } from './stake-diko-section';
import { StakeUsdaSection } from './stake-usda-section';

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
  const [showStakeLp6Modal, setShowStakeLp6Modal] = useState(false);
  const [showUnstakeLp1Modal, setShowUnstakeLp1Modal] = useState(false);
  const [showUnstakeLp2Modal, setShowUnstakeLp2Modal] = useState(false);
  const [showUnstakeLp3Modal, setShowUnstakeLp3Modal] = useState(false);
  const [showUnstakeLp4Modal, setShowUnstakeLp4Modal] = useState(false);
  const [showUnstakeLp5Modal, setShowUnstakeLp5Modal] = useState(false);
  const [showUnstakeLp6Modal, setShowUnstakeLp6Modal] = useState(false);
  const [loadingApy, setLoadingApy] = useState(true);
  const [apy, setApy] = useState(0);
  const [dikoUsdaLpApy, setDikoUsdaLpApy] = useState(0);
  const [stxUsdaLpApy, setStxUsdaLpApy] = useState(0);
  const [stxDikoLpApy, setStxDikoLpApy] = useState(0);
  const [stxXbtcLpApy, setStxXbtcLpApy] = useState(0);
  const [xbtcUsdaLpApy, setXbtcUsdaLpApy] = useState(0);
  const [xusdUsdaLpApy, setXusdUsdaLpApy] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [lpDikoUsdaStakedAmount, setLpDikoUsdaStakedAmount] = useState(0);
  const [lpStxUsdaStakedAmount, setLpStxUsdaStakedAmount] = useState(0);
  const [lpStxDikoStakedAmount, setLpStxDikoStakedAmount] = useState(0);
  const [lpStxXbtcStakedAmount, setLpStxXbtcStakedAmount] = useState(0);
  const [lpXbtcUsdaStakedAmount, setLpXbtcUsdaStakedAmount] = useState(0);
  const [lpXusdUsdaStakedAmount, setLpXusdUsdaStakedAmount] = useState(0);
  const [lpDikoUsdaPendingRewards, setLpDikoUsdaPendingRewards] = useState(0);
  const [lpStxUsdaPendingRewards, setLpStxUsdaPendingRewards] = useState(0);
  const [lpStxDikoPendingRewards, setLpStxDikoPendingRewards] = useState(0);
  const [lpStxXbtcPendingRewards, setLpStxXbtcPendingRewards] = useState(0);
  const [lpXbtcUsdaPendingRewards, setLpXbtcUsdaPendingRewards] = useState(0);
  const [lpXusdUsdaPendingRewards, setLpXusdUsdaPendingRewards] = useState(0);
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
  const [xusdUsdaPoolInfo, setXusdUsdaPoolInfo] = useState(0);
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
  const [totalXusdUsdaStaked, setTotalXusdUsdaStaked] = useState(10);
  const [userPooledUsda, setUserPooledUsda] = useState(0);
  const [totalPooledUsda, setTotalPooledUsda] = useState(0);
  const [pooledUsdaDikoApr, setPooledUsdaDikoApr] = useState(0);


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
      const poolInfo = {};
      poolInfo['wrapped-stx-token/usda-token'] = data['wrapped-stx-token/usda-token'];
      poolInfo['arkadiko-token/usda-token'] = data['arkadiko-token/usda-token'];
      poolInfo['wrapped-stx-token/arkadiko-token'] = data['wrapped-stx-token/arkadiko-token'];
      poolInfo['wrapped-stx-token/Wrapped-Bitcoin'] = data['wrapped-stx-token/Wrapped-Bitcoin'];
      poolInfo['Wrapped-Bitcoin/usda-token'] = data['Wrapped-Bitcoin/usda-token'];

      // TODO: need to update API
      poolInfo['Wrapped-USD/usda-token'] = data['Wrapped-USD/usda-token'];
      setPoolInfo(poolInfo);

      // stake data
      setStDikoSupply(data.stdiko.total_supply);
      setTotalDikoStaked(data.diko.total_staked / 1000000);
      setTotalDikoUsdaStaked(data.arkv1dikousda.total_staked / 1000000);
      setTotalStxUsdaStaked(data.arkv1wstxusda.total_staked / 1000000);
      setTotalStxDikoStaked(data.arkv1wstxdiko.total_staked / 1000000);
      setTotalStxXbtcStaked(data.arkv1wstxxbtc.total_staked / 1000000);
      setTotalXbtcUsdaStaked(data.arkv1xbtcusda.total_staked / 1000000);

      setTotalXusdUsdaStaked(data['amm-swap-pool'].total_staked / 1000000);
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
        state.balance['xusdusda'] > 0
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
      } else if (poolContract == 'arkadiko-stake-pool-xusd-usda-v1-1') {
        tokenXContract = 'Wrapped-USD';
        tokenXDecimals = 8;
        tokenYContract = 'usda-token';
        tokenXName = 'xUSD';
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

    const getXusdUsdaStakingData = async () => {
      const xbtcUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-xusd-usda-v1-1',
        functionName: 'get-stake-amount-of',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const userXusdUsdaStakedData = cvToJSON(xbtcUsdaStakedCall).value;
      setLpXusdUsdaStakedAmount(userXusdUsdaStakedData);

      return userXusdUsdaStakedData;
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
        state.balance['xusdusda'] == undefined ||
        stxPrice === 0 ||
        dikoPrice === 0 ||
        usdaPrice === 0 ||
        currentBlock === 0 ||
        stDikoSupply === 0
      ) {
        return;
      }

      const totalStakingRewardsYear1 = 11750000;
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
      const stxDikoPoolRewards = 0;
      const stxDikoApr = stxDikoPoolRewards / (dikoStxDiko['walletValue'] / Number(dikoPrice / 1000000));
      setStxDikoLpApy(Number((100 * stxDikoApr).toFixed(2)));

      const dikoStxXbtc = await lpTokenValue(
        'arkadiko-stake-pool-wstx-xbtc-v1-1',
        0,
        totalStxXbtcStaked
      );
      const stxXbtcPoolRewards = 0;
      const stxXbtcApr = stxXbtcPoolRewards / (dikoStxXbtc['walletValue'] / Number(dikoPrice / 1000000));
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

      const dikoXusdUsda = await lpTokenValue(
        'arkadiko-stake-pool-xusd-usda-v1-1',
        0,
        totalXusdUsdaStaked
      );
      const xusdUsdaPoolRewards = totalStakingRewardsYear1 * 0.118;
      const xusdUsdaApr =
        xusdUsdaPoolRewards / (dikoXusdUsda['walletValue'] / Number(dikoPrice / 1000000));
      setXusdUsdaLpApy(Number((100 * xusdUsdaApr).toFixed(2)));

      setLoadingApy(false);

      // User staked amounts
      const [
        _,
        userStakedData,
        userXbtcStakedData,
        userXbtcUsdaStakedData,
        userXusdUsdaStakedData,
        stDiko,
        totalPooledUsda,
        userPooledUsda,
        epochInfo,
        dikoEpochRewardsToAdd,
      ] = await Promise.all([
          getStakedDiko(),
          getStakingData(),
          getXbtcStakingData(),
          getXbtcUsdaStakingData(),
          getXusdUsdaStakingData(),
          getDikoToStDiko(),
          getTotalPooled(),
          getUserPooled(),
          getEpochInfo(),
          getDikoEpochRewardsToAdd(),
        ]);

      // LP value
      const [dikoUsdaLpValue, stxUsdaLpValue, stxDikoLpValue, stxXbtcLpValue, xbtcUsdaLpValue, xusdUsdaLpValue] =
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
          lpTokenValue(
            'arkadiko-stake-pool-xusd-usda-v1-1',
            userXusdUsdaStakedData,
            state.balance['xusdusda']
          ),
        ]);

      setDikoUsdaPoolInfo(dikoUsdaLpValue);
      setStxUsdaPoolInfo(stxUsdaLpValue);
      setStxDikoPoolInfo(stxDikoLpValue);
      setStxXbtcPoolInfo(stxXbtcLpValue);
      setXbtcUsdaPoolInfo(xbtcUsdaLpValue);
      setXusdUsdaPoolInfo(xusdUsdaLpValue);

      // Pending rewards
      const [
        dikoUsdaLpPendingRewards,
        stxUsdaLpPendingRewards,
        stxDikoLpPendingRewards,
        stxXbtcLpPendingRewards,
        xbtcUsdaLpPendingRewards,
        xusdUsdaLpPendingRewards,
      ] = await Promise.all([
        fetchLpPendingRewards('arkadiko-stake-pool-diko-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-diko-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-xbtc-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-xbtc-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-xusd-usda-v1-1'),
      ]);

      setLpDikoUsdaPendingRewards(dikoUsdaLpPendingRewards);
      setLpStxUsdaPendingRewards(stxUsdaLpPendingRewards);
      setLpStxDikoPendingRewards(stxDikoLpPendingRewards);
      setLpStxXbtcPendingRewards(stxXbtcLpPendingRewards);
      setLpXbtcUsdaPendingRewards(xbtcUsdaLpPendingRewards);
      setLpXusdUsdaPendingRewards(xusdUsdaLpPendingRewards);

      // USDA Staking in Liquidation Pool
      setTotalPooledUsda(totalPooledUsda);
      setUserPooledUsda(userPooledUsda);

      const dikoPerYear = (52560 / epochInfo["blocks"].value) * dikoEpochRewardsToAdd;
      setPooledUsdaDikoApr((dikoPerYear * Number(dikoPrice / 1000000)) / totalPooledUsda * 100.0);

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

  const claimXusdUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-xusd-usda-v1-1'),
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

  const stakeXusdUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v1-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-xusd-usda-v1-1'),
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

  const getEpochInfo = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
      functionName: 'get-epoch-info',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const getDikoEpochRewardsToAdd = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
      functionName: 'get-rewards-to-add',
      functionArgs: [],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value;
    return result;
  };

  const getTotalPooled = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'usda-token',
      functionName: 'get-balance',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-liquidation-pool-v1-1'),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const getUserPooled = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-liquidation-pool-v1-1',
      functionName: 'get-tokens-of',
      functionArgs: [
        standardPrincipalCV(stxAddress || ''),
      ],
      senderAddress: stxAddress || '',
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const LP_DATA = [
    {
      name: 'xusdusda',
      tokenName: 'xUSD/USDA',
      showStakeModal: showStakeLp6Modal,
      setShowStakeModal: setShowStakeLp6Modal,
      showUnstakeModal: showUnstakeLp6Modal,
      setShowUnstakeModal: setShowUnstakeLp6Modal,
      stakedAmount: lpXusdUsdaStakedAmount,
      apy: xusdUsdaLpApy,
    },
    {
      name: 'dikousda',
      tokenName: 'DIKO/USDA',
      showStakeModal: showStakeLp1Modal,
      setShowStakeModal: setShowStakeLp1Modal,
      showUnstakeModal: showUnstakeLp1Modal,
      setShowUnstakeModal: setShowUnstakeLp1Modal,
      stakedAmount: lpDikoUsdaStakedAmount,
      apy: dikoUsdaLpApy,
    },
    {
      name: 'wstxusda',
      tokenName: 'STX/USDA',
      showStakeModal: showStakeLp2Modal,
      setShowStakeModal: setShowStakeLp2Modal,
      showUnstakeModal: showUnstakeLp2Modal,
      setShowUnstakeModal: setShowUnstakeLp2Modal,
      stakedAmount: lpStxUsdaStakedAmount,
      apy: stxUsdaLpApy,
    },
    {
      name: 'wstxdiko',
      tokenName: 'STX/DIKO',
      showStakeModal: showStakeLp3Modal,
      setShowStakeModal: setShowStakeLp3Modal,
      showUnstakeModal: showUnstakeLp3Modal,
      setShowUnstakeModal: setShowUnstakeLp3Modal,
      stakedAmount: lpStxDikoStakedAmount,
      apy: stxDikoLpApy,
    },
    {
      name: 'wstxxbtc',
      tokenName: 'STX/xBTC',
      showStakeModal: showStakeLp4Modal,
      setShowStakeModal: setShowStakeLp4Modal,
      showUnstakeModal: showUnstakeLp4Modal,
      setShowUnstakeModal: setShowUnstakeLp4Modal,
      stakedAmount: lpStxXbtcStakedAmount,
      apy: stxXbtcLpApy,
    },
    {
      name: 'xbtcusda',
      tokenName: 'xBTC/USDA',
      showStakeModal: showStakeLp5Modal,
      setShowStakeModal: setShowStakeLp5Modal,
      showUnstakeModal: showUnstakeLp5Modal,
      setShowUnstakeModal: setShowUnstakeLp5Modal,
      stakedAmount: lpXbtcUsdaStakedAmount,
      apy: xbtcUsdaLpApy,
    },
  ];

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

      {LP_DATA.map(lp => (
        <StakeLpModal
          key={lp.name}
          showStakeModal={lp.showStakeModal}
          setShowStakeModal={lp.setShowStakeModal}
          apy={lp.apy}
          balanceName={lp.name}
          tokenName={lp.tokenName}
        />
      ))}

      {LP_DATA.map(lp => (
        <UnstakeLpModal
          key={lp.name}
          showUnstakeModal={lp.showUnstakeModal}
          setShowUnstakeModal={lp.setShowUnstakeModal}
          stakedAmount={lp.stakedAmount}
          balanceName={lp.name}
          tokenName={lp.tokenName}
        />
      ))}

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">
            {hasUnstakedTokens ? (
              <div className="mb-4">
                <Alert title="Unstaked LP tokens">
                  <p>👀 We noticed that your wallet contains LP Tokens that are not staked yet.</p>
                  <p className="mt-1">
                    If you want to stake them, pick the appropriate token in the table below, hit
                    the Actions dropdown button and choose Stake LP to initiate staking.
                  </p>
                </Alert>
              </div>
            ) : null}

            <StakeDikoSection
              loadingData={loadingData}
              loadingDikoToStDiko={loadingDikoToStDiko}
              canUnstake={canUnstake}
              stDikoToDiko={stDikoToDiko}
              stakedAmount={stakedAmount}
              dikoCooldown={dikoCooldown}
              dikoBalance={state.balance['diko']}
              stDikoBalance={state.balance['stdiko']}
              apy={apy}
              cooldownRunning={cooldownRunning}
              startDikoCooldown={startDikoCooldown}
              setShowStakeModal={setShowStakeModal}
              setShowUnstakeModal={setShowUnstakeModal}
            />

            <StakeUsdaSection
              loadingData={loadingData}
              userPooledUsda={userPooledUsda}
              totalPooledUsda={totalPooledUsda}
              pooledUsdaDikoApr={pooledUsdaDikoApr}
            />

            <section className="relative mt-8 overflow-hidden">
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
                <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                  Liquidity Provider Tokens
                </h3>
                <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400 dark:text-zinc-300">
                  Over time, DIKO rewards will accumulate which you can claim to your wallet or
                  stake in the Security Module. Happy farming!
                </p>
              </header>

              <div className="flex flex-col mt-4">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-zinc-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                        <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
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

                        {/* ALEX xUSD USDA LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          canStake={true}
                          tokenListItemX={3}
                          tokenListItemY={0}
                          balance={state.balance['xusdusda']}
                          pendingRewards={lpXusdUsdaPendingRewards}
                          stakedAmount={lpXusdUsdaStakedAmount}
                          apy={xusdUsdaLpApy}
                          poolInfo={xusdUsdaPoolInfo}
                          setShowStakeLpModal={setShowStakeLp6Modal}
                          setShowUnstakeLpModal={setShowUnstakeLp6Modal}
                          claimLpPendingRewards={claimXusdUsdaLpPendingRewards}
                          stakeLpPendingRewards={stakeXusdUsdaLpPendingRewards}
                          getLpRoute={'/swap/add/xUSD/USDA'}
                        />

                        {/* Arkadiko V1 DIKO USDA LP Token */}
                        <StakeLpRow
                          loadingApy={loadingApy}
                          loadingData={loadingData}
                          canStake={true}
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
                          canStake={true}
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
                          canStake={false}
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
                          canStake={false}
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
                          canStake={true}
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
