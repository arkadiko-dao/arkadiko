import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
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
import { getRPCClient } from '@common/utils';

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
  const [showStakeLp7Modal, setShowStakeLp7Modal] = useState(false);
  const [showUnstakeLp1Modal, setShowUnstakeLp1Modal] = useState(false);
  const [showUnstakeLp2Modal, setShowUnstakeLp2Modal] = useState(false);
  const [showUnstakeLp3Modal, setShowUnstakeLp3Modal] = useState(false);
  const [showUnstakeLp4Modal, setShowUnstakeLp4Modal] = useState(false);
  const [showUnstakeLp5Modal, setShowUnstakeLp5Modal] = useState(false);
  const [showUnstakeLp6Modal, setShowUnstakeLp6Modal] = useState(false);
  const [showUnstakeLp7Modal, setShowUnstakeLp7Modal] = useState(false);
  const [loadingApy, setLoadingApy] = useState(true);
  const [apy, setApy] = useState(0);
  const [dikoUsdaLpApy, setDikoUsdaLpApy] = useState(0);
  const [stxUsdaLpApy, setStxUsdaLpApy] = useState(0);
  const [stxDikoLpApy, setStxDikoLpApy] = useState(0);
  const [stxXbtcLpApy, setStxXbtcLpApy] = useState(0);
  const [xbtcUsdaLpApy, setXbtcUsdaLpApy] = useState(0);
  const [xusdUsdaLpApy, setXusdUsdaLpApy] = useState(0);
  const [xusdUsda2LpApy, setXusdUsda2LpApy] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [lpDikoUsdaStakedAmount, setLpDikoUsdaStakedAmount] = useState(0);
  const [lpStxUsdaStakedAmount, setLpStxUsdaStakedAmount] = useState(0);
  const [lpStxDikoStakedAmount, setLpStxDikoStakedAmount] = useState(0);
  const [lpStxXbtcStakedAmount, setLpStxXbtcStakedAmount] = useState(0);
  const [lpXbtcUsdaStakedAmount, setLpXbtcUsdaStakedAmount] = useState(0);
  const [lpXusdUsdaStakedAmount, setLpXusdUsdaStakedAmount] = useState(0);
  const [lpXusdUsda2StakedAmount, setLpXusdUsda2StakedAmount] = useState(0);
  const [lpDikoUsdaPendingRewards, setLpDikoUsdaPendingRewards] = useState(0);
  const [lpStxUsdaPendingRewards, setLpStxUsdaPendingRewards] = useState(0);
  const [lpStxDikoPendingRewards, setLpStxDikoPendingRewards] = useState(0);
  const [lpStxXbtcPendingRewards, setLpStxXbtcPendingRewards] = useState(0);
  const [lpXbtcUsdaPendingRewards, setLpXbtcUsdaPendingRewards] = useState(0);
  const [lpXusdUsdaPendingRewards, setLpXusdUsdaPendingRewards] = useState(0);
  const [lpXusdUsda2PendingRewards, setLpXusdUsda2PendingRewards] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [hasUnstakedTokens, setHasUnstakedTokens] = useState(false);
  const [poolInfo, setPoolInfo] = useState({});
  const [stxDikoPoolInfo, setStxDikoPoolInfo] = useState(0);
  const [stxUsdaPoolInfo, setStxUsdaPoolInfo] = useState(0);
  const [dikoUsdaPoolInfo, setDikoUsdaPoolInfo] = useState(0);
  const [stxXbtcPoolInfo, setStxXbtcPoolInfo] = useState(0);
  const [xbtcUsdaPoolInfo, setXbtcUsdaPoolInfo] = useState(0);
  const [xusdUsdaPoolInfo, setXusdUsdaPoolInfo] = useState(0);
  const [xusdUsda2PoolInfo, setXusdUsda2PoolInfo] = useState(0);
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
  const [totalXusdUsda2Staked, setTotalXusdUsda2Staked] = useState(10);
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

      // TODO: Update API
      // poolInfo['Wrapped-USD/usda-token'] = data['Wrapped-USD/usda-token'];
      const callPoolInfo = await callReadOnlyFunction({
        contractAddress: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
        contractName: 'amm-swap-pool',
        functionName: 'get-pool-details',
        functionArgs: [
          contractPrincipalCV("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", 'token-wxusd'),
          contractPrincipalCV("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", 'token-wusda'),
          uintCV(10000),
        ],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const callPoolInfoResult = cvToJSON(callPoolInfo).value.value;
      poolInfo['Wrapped-USD/usda-token'] = {
        "balance_x": callPoolInfoResult["balance-x"].value,
        "balance_y": callPoolInfoResult["balance-y"].value,
        "shares_total": callPoolInfoResult["total-supply"].value,
      }

      setPoolInfo(poolInfo);

      // stake data
      setStDikoSupply(data.stdiko.total_supply);
      setTotalDikoStaked(data.diko.total_staked / 1000000);
      setTotalDikoUsdaStaked(data.arkv1dikousda.total_staked / 1000000);
      setTotalStxUsdaStaked(data.arkv1wstxusda.total_staked / 1000000);
      setTotalStxDikoStaked(data.arkv1wstxdiko.total_staked / 1000000);
      setTotalStxXbtcStaked(data.arkv1wstxxbtc.total_staked / 1000000);
      setTotalXbtcUsdaStaked(data.arkv1xbtcusda.total_staked / 1000000);

      // TODO: move this to API
      const callStakedInfo = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-xusd-usda-v1-5',
        functionName: 'get-total-staked',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const callStakedInfoResult = cvToJSON(callStakedInfo).value;
      setTotalXusdUsda2Staked(callStakedInfoResult / 100000000);

      setCurrentBlock(data.block_height);

      const getDikoUsdaAmmPrice = async () => {
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
        const fetchPair = async () => {
          const details = await callReadOnlyFunction({
            contractAddress,
            contractName: 'arkadiko-swap-v2-1',
            functionName: 'get-pair-details',
            functionArgs: [
              contractPrincipalCV(contractAddress, 'arkadiko-token'),
              contractPrincipalCV(contractAddress, 'usda-token'),
            ],
            senderAddress: contractAddress,
            network: network,
          });

          return cvToJSON(details);
        };

        const pair = await fetchPair();
        if (pair.success) {
          const pairDetails = pair.value.value.value;
          return (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(2);
        } else {
          return 0;
        }
      };

      // prices
      setDikoPrice(1000000.0 * await getDikoUsdaAmmPrice());
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
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
          standardPrincipalCV(stxAddress || contractAddress),
        ],
        senderAddress: stxAddress || contractAddress,
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
      } else if (poolContract == 'arkadiko-stake-pool-xusd-usda-v1-4' || poolContract === 'arkadiko-stake-pool-xusd-usda-v1-5') {
        tokenXContract = 'Wrapped-USD';
        tokenXDecimals = 8;
        tokenYContract = 'usda-token';
        tokenYDecimals = 8;
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
      if (tokenXName == 'xUSD' && tokenYName == 'USDA') {
        estimatedValueStaked = stakedBalanceX + stakedBalanceY;
        estimatedValueWallet = walletBalanceX + walletBalanceY;
      } else if (tokenXName == 'STX') {
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
        contractName: 'arkadiko-ui-stake-v1-5',
        functionName: 'get-stake-amounts',
        functionArgs: [standardPrincipalCV(stxAddress || contractAddress)],
        senderAddress: stxAddress || contractAddress,
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
        functionArgs: [standardPrincipalCV(stxAddress || contractAddress)],
        senderAddress: stxAddress || contractAddress,
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
        functionArgs: [standardPrincipalCV(stxAddress || contractAddress)],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const userXbtcUsdaStakedData = cvToJSON(xbtcUsdaStakedCall).value;
      setLpXbtcUsdaStakedAmount(userXbtcUsdaStakedData);

      return userXbtcUsdaStakedData;
    };

    const getXusdUsdaStakingData = async () => {
      const xbtcUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-xusd-usda-v1-4',
        functionName: 'get-stake-amount-of',
        functionArgs: [standardPrincipalCV(stxAddress || contractAddress)],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const userXusdUsdaStakedData = cvToJSON(xbtcUsdaStakedCall).value;
      setLpXusdUsdaStakedAmount(userXusdUsdaStakedData);

      return userXusdUsdaStakedData;
    };

    const getXusdUsda2StakingData = async () => {
      const xbtcUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-xusd-usda-v1-5',
        functionName: 'get-stake-amount-of',
        functionArgs: [standardPrincipalCV(stxAddress || contractAddress)],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const userXusdUsdaStakedData = cvToJSON(xbtcUsdaStakedCall).value;
      setLpXusdUsda2StakedAmount(userXusdUsdaStakedData);

      return userXusdUsdaStakedData;
    };

    const getStakedDiko = async () => {
      if (!stxAddress) return setStakedAmount(0);

      const userStakedDikoCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v2-1',
        functionName: 'get-stake-of',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
          standardPrincipalCV(stxAddress || contractAddress),
          uintCV(stDikoSupply),
        ],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const userStakedDikoData = cvToJSON(userStakedDikoCall).value.value;
      setStakedAmount(userStakedDikoData);

      return userStakedDikoData;
    };

    const getDikoToStDiko = async () => {
      const stDikoToDikoCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-stake-pool-diko-v2-1',
        functionName: 'diko-for-stdiko',
        functionArgs: [
          contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
          uintCV(1000000 * 10),
          uintCV(stDikoSupply),
        ],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const stDikoToDiko = cvToJSON(stDikoToDikoCall).value.value / 10;
      setStDikoToDiko(Number(stDikoToDiko) / 1000000);
      setLoadingDikoToStDiko(false);

      return stDikoToDiko;
    };

    const getData = async () => {
      if (
        stxPrice === 0 ||
        dikoPrice === 0 ||
        usdaPrice === 0 ||
        currentBlock === 0 ||
        stDikoSupply === 0
      ) {
        return;
      }

      const totalStakingRewardsYear1 = 2937500;
      const dikoPoolRewards = totalStakingRewardsYear1 * 0.16;
      const dikoApr = dikoPoolRewards / totalDikoStaked;
      setApy(Number((100 * dikoApr).toFixed(2)));

      const dikoDikoUsda = await lpTokenValue(
        'arkadiko-stake-pool-diko-usda-v1-1',
        0,
        totalDikoUsdaStaked
      );
      const dikoUsdaPoolRewards = totalStakingRewardsYear1 * 0.19;
      const dikoUsdaApr =
        dikoUsdaPoolRewards / (dikoDikoUsda['walletValue'] / Number(dikoPrice / 1000000));
      setDikoUsdaLpApy(Number((100 * dikoUsdaApr).toFixed(2)));

      const dikoStxUsda = await lpTokenValue(
        'arkadiko-stake-pool-wstx-usda-v1-1',
        0,
        totalStxUsdaStaked
      );
      const stxUsdaPoolRewards = totalStakingRewardsYear1 * 0.31;
      const stxUsdaApr =
        stxUsdaPoolRewards / (dikoStxUsda['walletValue'] / Number(dikoPrice / 1000000));
      setStxUsdaLpApy(Number((100 * stxUsdaApr).toFixed(2)));

      const dikoStxDiko = await lpTokenValue(
        'arkadiko-stake-pool-wstx-diko-v1-1',
        0,
        totalStxDikoStaked
      );
      const stxDikoPoolRewards = totalStakingRewardsYear1 * 0.13;
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
      const xbtcUsdaPoolRewards = totalStakingRewardsYear1 * 0;
      const xbtcUsdaApr =
        xbtcUsdaPoolRewards / (dikoXbtcUsda['walletValue'] / Number(dikoPrice / 1000000));
      setXbtcUsdaLpApy(Number((100 * xbtcUsdaApr).toFixed(2)));

      const dikoXusdUsda = await lpTokenValue(
        'arkadiko-stake-pool-xusd-usda-v1-5',
        0,
        totalXusdUsda2Staked * 100
      );
      const xusdUsdaPoolRewards = totalStakingRewardsYear1 * 0;
      const xusdUsdaApr =
        xusdUsdaPoolRewards / (dikoXusdUsda['walletValue'] / Number(dikoPrice / 1000000));
      setXusdUsdaLpApy(0);
      setXusdUsda2LpApy(Number((100 * xusdUsdaApr).toFixed(2)));

      setLoadingApy(false);

      // User staked amounts
      const [
        _,
        userStakedData,
        userXbtcStakedData,
        userXbtcUsdaStakedData,
        userXusdUsdaStakedData,
        userXusdUsda2StakedData,
        stDiko,
        totalPooledUsda,
        userPooledUsda
      ] = await Promise.all([
          getStakedDiko(),
          getStakingData(),
          getXbtcStakingData(),
          getXbtcUsdaStakingData(),
          getXusdUsdaStakingData(),
          getXusdUsda2StakingData(),
          getDikoToStDiko(),
          getTotalPooled(),
          getUserPooled()
        ]);

      // LP value
      const [dikoUsdaLpValue, stxUsdaLpValue, stxDikoLpValue, stxXbtcLpValue, xbtcUsdaLpValue, xusdUsdaLpValue, xusdUsda2LpValue] =
        await Promise.all([
          lpTokenValue(
            'arkadiko-stake-pool-diko-usda-v1-1',
            userStakedData['stake-amount-diko-usda'].value,
            state.balance['dikousda'] || 0
          ),
          lpTokenValue(
            'arkadiko-stake-pool-wstx-usda-v1-1',
            userStakedData['stake-amount-wstx-usda'].value,
            state.balance['wstxusda'] || 0
          ),
          lpTokenValue(
            'arkadiko-stake-pool-wstx-diko-v1-1',
            userStakedData['stake-amount-wstx-diko'].value,
            state.balance['wstxdiko'] || 0
          ),
          lpTokenValue(
            'arkadiko-stake-pool-wstx-xbtc-v1-1',
            userXbtcStakedData,
            state.balance['wstxxbtc'] || 0
          ),
          lpTokenValue(
            'arkadiko-stake-pool-xbtc-usda-v1-1',
            userXbtcUsdaStakedData,
            state.balance['xbtcusda'] || 0
          ),
          lpTokenValue(
            'arkadiko-stake-pool-xusd-usda-v1-4',
            userXusdUsdaStakedData,
            state.balance['xusdusda'] || 0
          ),
          lpTokenValue(
            'arkadiko-stake-pool-xusd-usda-v1-5',
            userXusdUsda2StakedData,
            state.balance['xusdusda2'] || 0
          ),
        ]);

      setDikoUsdaPoolInfo(dikoUsdaLpValue);
      setStxUsdaPoolInfo(stxUsdaLpValue);
      setStxDikoPoolInfo(stxDikoLpValue);
      setStxXbtcPoolInfo(stxXbtcLpValue);
      setXbtcUsdaPoolInfo(xbtcUsdaLpValue);
      setXusdUsdaPoolInfo(xusdUsdaLpValue);
      setXusdUsda2PoolInfo(xusdUsda2LpValue);

      // Pending rewards
      const [
        dikoUsdaLpPendingRewards,
        stxUsdaLpPendingRewards,
        stxDikoLpPendingRewards,
        stxXbtcLpPendingRewards,
        xbtcUsdaLpPendingRewards,
        xusdUsdaLpPendingRewards,
        xusdUsda2LpPendingRewards
      ] = await Promise.all([
        fetchLpPendingRewards('arkadiko-stake-pool-diko-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-usda-v1-1'),
        fetchLpPendingRewards('arkadiko-stake-pool-wstx-diko-v1-1'),
        0,
        0,
        0,
        0
      ]);

      setLpDikoUsdaPendingRewards(dikoUsdaLpPendingRewards);
      setLpStxUsdaPendingRewards(stxUsdaLpPendingRewards);
      setLpStxDikoPendingRewards(stxDikoLpPendingRewards);
      setLpStxXbtcPendingRewards(stxXbtcLpPendingRewards);
      setLpXbtcUsdaPendingRewards(xbtcUsdaLpPendingRewards);
      setLpXusdUsdaPendingRewards(xusdUsdaLpPendingRewards);
      setLpXusdUsda2PendingRewards(xusdUsda2LpPendingRewards);

      // USDA Staking in Liquidation Pool
      setTotalPooledUsda(totalPooledUsda);
      setUserPooledUsda(userPooledUsda);

      const dikoPerYear = totalStakingRewardsYear1 * 1000 * 0; // 0 % of all emissions
      setPooledUsdaDikoApr((dikoPerYear * dikoPrice / 1000000) / totalPooledUsda * 100000.0);

      setLoadingData(false);
    };
    if (mounted) {
      void checkUnstakedTokens();
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, [state.balance, stxPrice, dikoPrice, usdaPrice]);

  const claimDikoUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const claimStxUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const claimStxDikoLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeDikoUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-usda-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const claimStxXbtcLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeStxXbtcLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-xbtc-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const claimXbtcUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const claimXusdUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-xusd-usda-v1-4',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1')
      ],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const claimXusdUsda2LpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-xusd-usda-v1-5',
      functionName: 'claim-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1')
      ],
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeXbtcUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-xbtc-usda-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeXusdUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-xusd-usda-v1-4',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeXusdUsda2LpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-xusd-usda-v1-5',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeStxUsdaLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-usda-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const stakeStxDikoLpPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake-pending-rewards',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-wstx-diko-v1-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
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
    }, resolveProvider() || window.StacksProvider);
  };

  const getTotalPooled = async () => {
    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'usda-token',
      functionName: 'get-balance',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-vaults-pool-liq-v1-2'),
      ],
      senderAddress: stxAddress || contractAddress,
      network: network,
    });
    const result = cvToJSON(call).value.value;
    return result;
  };

  const getUserPooled = async () => {
    if (!stxAddress) return 0;

    const call = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-vaults-pool-liq-v1-2',
      functionName: 'get-stake-of',
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
      decimals: 8
    },
    {
      name: 'xusdusda2',
      tokenName: 'xUSD/USDA',
      showStakeModal: showStakeLp7Modal,
      setShowStakeModal: setShowStakeLp7Modal,
      showUnstakeModal: showUnstakeLp7Modal,
      setShowUnstakeModal: setShowUnstakeLp7Modal,
      stakedAmount: lpXusdUsda2StakedAmount,
      apy: xusdUsda2LpApy,
      decimals: 8
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
      decimals: 6
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
      decimals: 6
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
      decimals: 6
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
      decimals: 6
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
      decimals: 6
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
          decimals={lp.decimals}
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
          decimals={lp.decimals}
        />
      ))}

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
            stDikoToDiko={stDikoToDiko}
            stakedAmount={stakedAmount}
            dikoBalance={state.balance['diko'] || 0}
            stDikoBalance={state.balance['stdiko'] || 0}
            apy={apy}
            setShowStakeModal={setShowStakeModal}
            setShowUnstakeModal={setShowUnstakeModal}
          />

          <StakeUsdaSection
            loadingData={loadingData}
            userPooledUsda={userPooledUsda}
            totalPooledUsda={totalPooledUsda}
            pooledUsdaDikoApr={pooledUsdaDikoApr}
          />

          <section className="relative mt-8">
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
              <div className="-my-2 sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="border border-gray-200 dark:border-zinc-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                      <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
                        <tr>
                          <th
                            scope="col"
                            className="hidden px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase lg:table-cell dark:text-zinc-400"
                          >
                            LP Token
                          </th>
                          <th
                            scope="col"
                            className="hidden px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase lg:table-cell dark:text-zinc-400"
                          >
                            Current APR
                          </th>
                          <th
                            scope="col"
                            className="hidden px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase lg:table-cell dark:text-zinc-400"
                          >
                            Available
                          </th>
                          <th
                            scope="col"
                            className="hidden px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase lg:table-cell dark:text-zinc-400"
                          >
                            Staked
                          </th>
                          <th
                            scope="col"
                            className="hidden px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase lg:table-cell dark:text-zinc-400"
                          >
                            Rewards
                          </th>
                          <th
                            scope="col"
                            className="hidden px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase lg:table-cell dark:text-zinc-400"
                          >
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>

                      {/* Arkadiko V1 DIKO USDA LP Token */}
                      <StakeLpRow
                        foreign={false}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={state.userData}
                        tokenListItemX={1}
                        tokenListItemY={0}
                        balance={state.balance['dikousda'] || 0}
                        pendingRewards={lpDikoUsdaPendingRewards}
                        stakedAmount={lpDikoUsdaStakedAmount}
                        apy={dikoUsdaLpApy}
                        poolInfo={dikoUsdaPoolInfo}
                        setShowStakeLpModal={setShowStakeLp1Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp1Modal}
                        claimLpPendingRewards={claimDikoUsdaLpPendingRewards}
                        stakeLpPendingRewards={stakeDikoUsdaLpPendingRewards}
                        getLpRoute={'/swap/add/DIKO/USDA'}
                        decimals={6}
                      />

                      {/* Arkadiko V1 STX USDA LP Token */}
                      <StakeLpRow
                        foreign={false}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={state.userData}
                        tokenListItemX={2}
                        tokenListItemY={0}
                        balance={state.balance['wstxusda'] || 0}
                        pendingRewards={lpStxUsdaPendingRewards}
                        stakedAmount={lpStxUsdaStakedAmount}
                        apy={stxUsdaLpApy}
                        poolInfo={stxUsdaPoolInfo}
                        setShowStakeLpModal={setShowStakeLp2Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp2Modal}
                        claimLpPendingRewards={claimStxUsdaLpPendingRewards}
                        stakeLpPendingRewards={stakeStxUsdaLpPendingRewards}
                        getLpRoute={'/swap/add/STX/USDA'}
                        decimals={6}
                      />

                      {/* Arkadiko V1 STX DIKO LP Token */}
                      <StakeLpRow
                        foreign={false}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={state.userData}
                        tokenListItemX={2}
                        tokenListItemY={1}
                        balance={state.balance['wstxdiko'] || 0}
                        pendingRewards={lpStxDikoPendingRewards}
                        stakedAmount={lpStxDikoStakedAmount}
                        apy={stxDikoLpApy}
                        poolInfo={stxDikoPoolInfo}
                        setShowStakeLpModal={setShowStakeLp3Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp3Modal}
                        claimLpPendingRewards={claimStxDikoLpPendingRewards}
                        stakeLpPendingRewards={stakeStxDikoLpPendingRewards}
                        getLpRoute={'/swap/add/STX/DIKO'}
                        decimals={6}
                      />

                      {/* Arkadiko V1 STX xBTC LP Token */}
                      <StakeLpRow
                        foreign={false}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={false}
                        tokenListItemX={2}
                        tokenListItemY={3}
                        balance={state.balance['wstxxbtc'] || 0}
                        pendingRewards={lpStxXbtcPendingRewards}
                        stakedAmount={lpStxXbtcStakedAmount}
                        apy={stxXbtcLpApy}
                        poolInfo={stxXbtcPoolInfo}
                        setShowStakeLpModal={setShowStakeLp4Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp4Modal}
                        claimLpPendingRewards={claimStxXbtcLpPendingRewards}
                        stakeLpPendingRewards={stakeStxXbtcLpPendingRewards}
                        getLpRoute={'/swap/add/STX/xBTC'}
                        decimals={6}
                      />

                      {/* Arkadiko V1 xBTC USDA LP Token */}
                      <StakeLpRow
                        foreign={false}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={true}
                        tokenListItemX={3}
                        tokenListItemY={0}
                        balance={state.balance['xbtcusda'] || 0}
                        pendingRewards={lpXbtcUsdaPendingRewards}
                        stakedAmount={lpXbtcUsdaStakedAmount}
                        apy={xbtcUsdaLpApy}
                        poolInfo={xbtcUsdaPoolInfo}
                        setShowStakeLpModal={setShowStakeLp5Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp5Modal}
                        claimLpPendingRewards={claimXbtcUsdaLpPendingRewards}
                        stakeLpPendingRewards={stakeXbtcUsdaLpPendingRewards}
                        getLpRoute={'/swap/add/xBTC/USDA'}
                        decimals={6}
                      />

                      {/* ALEX xUSD USDA LP Token */}
                      <StakeLpRow
                        foreign={true}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={false}
                        tokenListItemX={8}
                        tokenListItemY={0}
                        balance={state.balance['xusdusda'] || 0}
                        pendingRewards={lpXusdUsdaPendingRewards}
                        stakedAmount={lpXusdUsdaStakedAmount}
                        apy={xusdUsdaLpApy}
                        poolInfo={xusdUsdaPoolInfo}
                        setShowStakeLpModal={setShowStakeLp6Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp6Modal}
                        claimLpPendingRewards={claimXusdUsdaLpPendingRewards}
                        stakeLpPendingRewards={stakeXusdUsdaLpPendingRewards}
                        getLpRoute={'https://app.alexlab.co/pool/token-amm-swap-pool:token-wxusd,token-wusda,0.0001e8'}
                        decimals={8}
                      />

                      {/* ALEX xUSD USDA 2 LP Token */}
                      <StakeLpRow
                        foreign={true}
                        loadingApy={loadingApy}
                        loadingData={loadingData}
                        canStake={false}
                        tokenListItemX={8}
                        tokenListItemY={0}
                        balance={state.balance['xusdusda2'] || 0}
                        pendingRewards={lpXusdUsda2PendingRewards}
                        stakedAmount={lpXusdUsda2StakedAmount}
                        apy={xusdUsda2LpApy}
                        poolInfo={xusdUsda2PoolInfo}
                        setShowStakeLpModal={setShowStakeLp7Modal}
                        setShowUnstakeLpModal={setShowUnstakeLp7Modal}
                        claimLpPendingRewards={claimXusdUsda2LpPendingRewards}
                        stakeLpPendingRewards={stakeXusdUsda2LpPendingRewards}
                        getLpRoute={'https://app.alexlab.co/pool/token-amm-swap-pool:token-wxusd,token-wusda,0.005e8'}
                        decimals={8}
                      />
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Container>
    </>
  );
};
