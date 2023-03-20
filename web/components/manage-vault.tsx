import React, { useContext, useEffect, useState } from 'react';
import { Tooltip } from '@blockstack/ui';
import { Container } from './home';
import { VaultDepositModal } from '@components/vault-deposit-modal';
import { VaultWithdrawModal } from '@components/vault-withdraw-modal';
import { VaultMintModal } from '@components/vault-mint-modal';
import { VaultBurnModal } from '@components/vault-burn-modal';
import { VaultCloseModal } from '@components/vault-close-modal';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import {
  AnchorMode,
  uintCV,
  stringAsciiCV,
  contractPrincipalCV,
  cvToJSON,
  callReadOnlyFunction,
  falseCV,
} from '@stacks/transactions';
import { AppContext, CollateralTypeProps } from '@common/context';
import { debtClass, VaultProps } from './vault';
import { getPrice } from '@common/get-price';
import { getLiquidationPrice, availableCoinsToMint } from '@common/vault-utils';
import { Redirect } from 'react-router-dom';
import { resolveReserveName } from '@common/vault-utils';
import { getRPCClient } from '@common/utils';
import { microToReadable, availableCollateralToWithdraw } from '@common/vault-utils';
import { addMinutes } from 'date-fns';
import { Placeholder } from './ui/placeholder';
import { Alert } from './ui/alert';
import { PoxTimeline } from '@components/pox-timeline';
import { StyledIcon } from './ui/styled-icon';
import { Status } from './ui/health-status';

export const ManageVault = ({ match }) => {
  const { doContractCall } = useConnect();
  const senderAddress = useSTXAddress();
  const [state, setState] = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);

  const [maximumCollateralToWithdraw, setMaximumCollateralToWithdraw] = useState(0);
  const [reserveName, setReserveName] = useState('');
  const [vault, setVault] = useState<VaultProps>();
  const [price, setPrice] = useState(0);
  const [debtRatio, setDebtRatio] = useState(0);
  const [collateralType, setCollateralType] = useState<CollateralTypeProps>();
  const [isVaultOwner, setIsVaultOwner] = useState(false);
  const [stabilityFee, setStabilityFee] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [unlockBurnHeight, setUnlockBurnHeight] = useState(0);
  const [enabledStacking, setEnabledStacking] = useState(true);
  const [startedStacking, setStartedStacking] = useState(true);
  const [canWithdrawCollateral, setCanWithdrawCollateral] = useState(false);
  const [canUnlockCollateral, setCanUnlockCollateral] = useState(false);
  const [canStackCollateral, setCanStackCollateral] = useState(false);
  const [decimals, setDecimals] = useState(1000000);
  const [stackingEndDate, setStackingEndDate] = useState('');
  const [poxYield, setPoxYield] = useState(0);
  const [usdaYield, setUsdaYield] = useState(0);
  const [burnBlockHeight, setBurnBlockHeight] = useState(0);

  const [loadingVaultData, setLoadingVaultData] = useState(true);
  const [loadingFeesData, setLoadingFeesData] = useState(true);
  const [loadingStackerData, setLoadingStackerData] = useState(true);
  const [loadingPoxYieldData, setLoadingPoxYieldData] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
      const serializedVault = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-vault-by-id',
        functionArgs: [uintCV(match.params.id)],
        senderAddress: senderAddress || contractAddress,
        network: network,
      });

      const data = cvToJSON(serializedVault).value;

      if (data['id'].value !== 0) {
        setVault({
          id: data['id'].value,
          owner: data['owner'].value,
          collateral: data['collateral'].value,
          collateralType: data['collateral-type'].value,
          collateralToken: data['collateral-token'].value,
          isLiquidated: data['is-liquidated'].value,
          auctionEnded: data['auction-ended'].value,
          leftoverCollateral: data['leftover-collateral'].value,
          debt: data['debt'].value,
          stackedTokens: data['stacked-tokens'].value,
          stackerName: data['stacker-name'].value,
          revokedStacking: data['revoked-stacking'].value,
          collateralData: {},
        });
        setReserveName(resolveReserveName(data['collateral-token'].value));
        setAuctionEnded(data['auction-ended'].value);
        setIsVaultOwner(data['owner'].value === senderAddress);

        const price = await getPrice(data['collateral-token'].value);
        setPrice(price);

        const type = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-collateral-types-v3-1',
          functionName: 'get-collateral-type-by-name',
          functionArgs: [stringAsciiCV(data['collateral-type'].value)],
          senderAddress: senderAddress || contractAddress,
          network: network,
        });

        const json = cvToJSON(type.value);
        setCollateralType({
          name: json.value['name'].value,
          token: json.value['token'].value,
          tokenType: json.value['token-type'].value,
          url: json.value['url'].value,
          totalDebt: json.value['total-debt'].value,
          collateralToDebtRatio: json.value['collateral-to-debt-ratio'].value,
          liquidationPenalty: json.value['liquidation-penalty'].value / 100,
          liquidationRatio: json.value['liquidation-ratio'].value,
          maximumDebt: json.value['maximum-debt'].value,
          stabilityFee: json.value['stability-fee'].value,
          stabilityFeeApy: json.value['stability-fee-apy'].value,
        });
        setLoadingVaultData(false);
      }
    };
    fetchVault();
  }, [match.params.id]);

  useEffect(() => {
    if (vault && collateralType?.collateralToDebtRatio) {
      if (Number(vault.stackedTokens) === 0) {
        setMaximumCollateralToWithdraw(
          availableCollateralToWithdraw(
            price,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio,
            vault?.collateralToken
          )
        );
      } else {
        setMaximumCollateralToWithdraw(0);
      }
    }
  }, [collateralType?.collateralToDebtRatio, price]);

  useEffect(() => {
    const fetchStackingInfo = async () => {
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      setBurnBlockHeight(data['burn_block_height']);
    };

    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-stability-fee-for-vault',
        functionArgs: [
          uintCV(vault?.id),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v3-1'),
        ],
        senderAddress: contractAddress || '',
        network: network,
      });

      const fee = cvToJSON(feeCall);
      setStabilityFee(fee.value.value);
      setTotalDebt(outstandingDebt() + fee.value.value / 1000000);
      setLoadingFeesData(false);
    };

    const fetchYield = async () => {
      const yieldCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-claim-yield-v2-1',
        functionName: 'get-claim-by-vault-id',
        functionArgs: [uintCV(vault?.id)],
        senderAddress: contractAddress || '',
        network: network,
      });
      const poxYield = cvToJSON(yieldCall);
      setPoxYield(poxYield.value['ustx'].value / 1000000);

      const usdaYieldCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-claim-usda-yield-v2-1',
        functionName: 'get-claim-by-vault-id',
        functionArgs: [uintCV(vault?.id)],
        senderAddress: contractAddress || '',
        network: network,
      });
      const poxUsdaYield = cvToJSON(usdaYieldCall);
      setUsdaYield(poxUsdaYield.value['usda'].value / 1000000);

      setLoadingPoxYieldData(false);
    };

    const fetchCollateralToDebtRatio = async () => {
      if (vault && vault['debt'] > 0) {
        const collToDebt = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-freddie-v1-1',
          functionName: 'calculate-current-collateral-to-debt-ratio',
          functionArgs: [
            uintCV(vault.id),
            contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v3-1'),
            contractPrincipalCV(contractAddress || '', 'arkadiko-oracle-v1-1'),
            falseCV(),
          ],
          senderAddress: senderAddress || contractAddress,
          network: network,
        });
        const json = cvToJSON(collToDebt);
        if (json.value) {
          setDebtRatio(json.value.value);
        }
      }
    };

    const fetchStackerHeight = async () => {
      if (vault?.stackedTokens == 0 && vault?.revokedStacking) {
        setEnabledStacking(false);
      }

      const name = vault?.stackerName;
      let contractName = 'arkadiko-stacker-v1-1';
      if (name === 'stacker-2') {
        contractName = 'arkadiko-stacker-2-v1-1';
      } else if (name === 'stacker-3') {
        contractName = 'arkadiko-stacker-3-v1-1';
      } else if (name === 'stacker-4') {
        contractName = 'arkadiko-stacker-4-v1-1';
      }

      const call = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-stacking-unlock-burn-height',
        functionArgs: [],
        senderAddress: contractAddress || '',
        network: network,
      });
      const unlockBurnHeight = cvToJSON(call).value.value;
      setUnlockBurnHeight(unlockBurnHeight);
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      const currentBurnHeight = data['burn_block_height'];

      if (Number(unlockBurnHeight) === 0) {
        setStartedStacking(false);
        if (Number(vault?.stackedTokens) === 0) {
          setCanWithdrawCollateral(true);
        }
        setCanUnlockCollateral(true);
        setLoadingStackerData(false);
        return;
      } else {
        setStartedStacking(true);
        if (unlockBurnHeight < currentBurnHeight) {
          setCanUnlockCollateral(true);
        }
        if (Number(vault?.stackedTokens) === 0 || unlockBurnHeight < currentBurnHeight) {
          setCanWithdrawCollateral(true);
        } else {
          setCanWithdrawCollateral(false);
        }
      }

      if (unlockBurnHeight < currentBurnHeight) {
        setStackingEndDate('');
      } else {
        const stackingBlocksLeft = unlockBurnHeight - currentBurnHeight;
        const stackingMinutesLeft = stackingBlocksLeft * 10 + 1440; // stacking blocks left * 10 minutes/block + 1 day
        const currentDate = new Date();
        const endDate = addMinutes(currentDate, stackingMinutesLeft);
        setStackingEndDate(endDate.toDateString());
      }
      setLoadingStackerData(false);
    };

    if (vault?.id) {
      const collateralType = vault['collateralType'].toLowerCase();
      if (collateralType.includes('stx')) {
        setCanStackCollateral(true);
        fetchYield();
      }
      setDecimals(['stx-a', 'stx-b', 'xbtc-a', 'btc'].includes(collateralType) ? 1000000 : 100000000);
      fetchFees();
      fetchStackerHeight();
      fetchCollateralToDebtRatio();
      fetchStackingInfo();
    }
  }, [vault]);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  const liquidationPrice = () => {
    if (vault) {
      // (liquidationRatio * coinsMinted) / collateral = rekt
      return getLiquidationPrice(
        collateralType?.liquidationRatio,
        vault['debt'],
        vault['collateral'],
        vault['collateralToken']
      );
    }

    return 0;
  };

  const collateralLocked = () => {
    if (vault) {
      const decimals = vault['collateralType'].toLowerCase().includes('stx') ? 1000000 : 100000000;
      return vault['collateral'] / decimals;
    }

    return 0;
  };

  const outstandingDebt = () => {
    if (vault) {
      return vault.debt / 1000000;
    }

    return 0;
  };

  const callToggleStacking = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'toggle-stacking',
      functionArgs: [uintCV(match.params.id)],
      onFinish: data => {
        console.log('finished toggling stacking!', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const stackCollateral = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'stack-collateral',
      functionArgs: [uintCV(match.params.id)],
      onFinish: data => {
        console.log('finished stacking!', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const unlockCollateral = async () => {
    const name = vault?.stackerName;
    let stackerId = 1;
    if (name === 'stacker-2') {
      stackerId = 2;
    } else if (name === 'stacker-3') {
      stackerId = 3;
    } else if (name === 'stacker-4') {
      stackerId = 4;
    }

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-pox-unstack-unlock-v1-1',
      functionName: 'unstack-and-unlock',
      functionArgs: [uintCV(match.params.id), uintCV(stackerId)],
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

  const claimYield = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-claim-yield-v2-1',
      functionName: 'claim',
      postConditionMode: 0x01,
      functionArgs: [
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
        falseCV(),
      ],
      onFinish: data => {
        console.log('claiming yield', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const claimYieldPayDebt = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-claim-usda-yield-v2-1',
      functionName: 'claim-and-burn',
      postConditionMode: 0x01,
      functionArgs: [
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
      ],
      onFinish: data => {
        console.log('claiming yield', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const vaultDetails = [
    {
      label: 'Collateral to Debt ratio',
      help: 'The amount of collateral you deposit in a vault versus the stablecoin debt you are minting against it',
      data: debtRatio,
      unit: '%'
    },
    {
      label: 'Minimum Ratio (before liquidation)',
      help: 'The collateral-to-debt ratio when your vault gets liquidated',
      data: collateralType?.liquidationRatio,
      unit: '%'
    },
    {
      label: 'Liquidation penalty',
      help: 'The penalty you pay when your vault gets liquidated',
      data: collateralType?.liquidationPenalty,
      unit: '%'
    },
    {
      label: 'Stability fee',
      help: 'Yearly interest you pay on your USDA loan',
      data: stabilityFee / 1000000,
      unit: 'USDA'
    }
  ]

  return (
    <Container>
      {auctionEnded && <Redirect to="/vaults" />}

      <VaultDepositModal
        showDepositModal={showDepositModal}
        setShowDepositModal={setShowDepositModal}
        match={match}
        vault={vault}
        reserveName={reserveName}
        decimals={['xbtc-a'].includes(vault?.collateralType?.toLowerCase()) ? decimals * 100 : decimals}
      />

      <VaultWithdrawModal
        showWithdrawModal={showWithdrawModal}
        setShowWithdrawModal={setShowWithdrawModal}
        match={match}
        maximumCollateralToWithdraw={maximumCollateralToWithdraw}
        vault={vault}
        reserveName={reserveName}
      />

      <VaultMintModal
        showMintModal={showMintModal}
        setShowMintModal={setShowMintModal}
        match={match}
        vault={vault}
        reserveName={reserveName}
        price={price}
        collateralType={collateralType}
      />

      <VaultBurnModal
        showBurnModal={showBurnModal}
        setShowBurnModal={setShowBurnModal}
        outstandingDebt={outstandingDebt}
        stabilityFee={stabilityFee}
        match={match}
        vault={vault}
        reserveName={reserveName}
      />

      <VaultCloseModal
        showCloseModal={showCloseModal}
        setShowCloseModal={setShowCloseModal}
        match={match}
        vault={vault}
        reserveName={reserveName}
      />

      <main className="flex-1 py-12">
        <section>
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold leading-6 text-gray-900 font-headings dark:text-zinc-50">
                {loadingVaultData ? (
                  <Placeholder className="py-2 w-[150px]" color={Placeholder.color.GRAY} />
                ) : (
                  <>
                    {vault?.collateralToken.toUpperCase()}/USDA — Vault #{match.params.id}
                  </>
                )}
              </h2>

              {debtRatio > 0 ? (
                loadingVaultData ? (
                  <Placeholder
                    className="justify-end py-2"
                    color={Placeholder.color.GRAY}
                    width={Placeholder.width.THIRD}
                  />
                ) : (
                  <>
                    {debtClass(collateralType?.liquidationRatio, debtRatio) == 'text-green-500' ? (
                      <Status
                        type={Status.type.SUCCESS }
                        label='Healthy'
                        labelHover='Low liquidation risk'
                      />
                    ) : debtClass(collateralType?.liquidationRatio, debtRatio) == 'text-orange-500' ? (
                      <Status
                        type={Status.type.WARNING}
                        label='Warning'
                        labelHover='Medium liquidation risk'
                      />
                    ) : (
                      <Status
                        type={Status.type.ERROR}
                        label='Danger'
                        labelHover='High liquidation risk'
                      />
                    )}
                  </>
                )
              ) : null}
            </div>
          </header>

          <div className="mt-4" id="liquidation-status-alert">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col bg-white divide-y divide-gray-200 rounded-md shadow dark:bg-zinc-800 dark:divide-zinc-600">
                <div className="px-4 py-3">
                  <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Vault details
                  </h3>
                </div>
                <div className="flex flex-col h-full px-4 py-3 mb-4">
                  <dl className="space-y-2">
                    {vaultDetails.map(detail => (
                      <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto" key={detail.label}>
                        <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                          <p className="text-sm font-normal leading-6 text-gray-500 dark:text-zinc-400">
                            {detail.label}
                          </p>
                          <Tooltip
                            shouldWrapChildren={true}
                            label={detail.help}
                          >
                            <StyledIcon
                              as="InformationCircleIcon"
                              size={5}
                              className="block ml-2 text-gray-400"
                            />
                          </Tooltip>
                        </dt>
                        <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                          {loadingVaultData ? (
                            <Placeholder
                              className="justify-end py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.FULL}
                            />
                          ) : (
                            <>
                              {detail.label === 'Collateral to Debt ratio' ? (
                                <p
                                  className={`text-base font-semibold leading-none ${debtClass(
                                    collateralType?.liquidationRatio,
                                    debtRatio
                                  )}`}
                                >
                                  {detail.data}
                                  <span className="text-sm font-normal ml-0.5">%</span>
                                </p>
                              ) : (
                                <p
                                  className="text-base font-semibold leading-none"
                                >
                                  {detail.data}
                                  <span className="text-sm font-normal ml-0.5">
                                    {detail.label === "Stability fee" ? 'USDA' : '%'}
                                  </span>
                                </p>
                              )}
                            </>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="p-3 mt-auto rounded-md bg-gray-50 dark:bg-gray-200">
                    <p className="text-xs font-semibold leading-none text-gray-400 uppercase dark:text-gray-500">
                      Current {vault?.collateralToken} price
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">${price / decimals}</p>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="bg-white rounded-md shadow dark:bg-zinc-800">
                  <div className="flex flex-col px-4 py-5 sm:p-6">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="flex items-center text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                            Available to mint
                            <Tooltip
                              className="ml-2"
                              shouldWrapChildren={true}
                              label={`When the price of ${vault?.collateralToken.toUpperCase()} increases compared to when you created a vault, your collateral is bigger in dollar value so you can mint more.`}
                            >
                              <StyledIcon
                                as="InformationCircleIcon"
                                size={5}
                                className="block ml-2 text-gray-400"
                              />
                            </Tooltip>
                          </p>
                          {loadingVaultData ? (
                            <Placeholder
                              className="py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.THIRD}
                            />
                          ) : (
                            <p className="mt-1 text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                              {availableCoinsToMint(
                                vault?.collateralToken === 'auto-alex' ? price / 100 : price,
                                collateralLocked(),
                                outstandingDebt(),
                                collateralType?.collateralToDebtRatio
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              <span className="text-sm font-normal">USDA</span>
                            </p>
                          )}
                        </div>
                        {isVaultOwner &&
                        !loadingVaultData &&
                        Number(
                          availableCoinsToMint(
                            price,
                            collateralLocked(),
                            outstandingDebt(),
                            collateralType?.collateralToDebtRatio
                          )
                        ) > 0 ? (
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowMintModal(true)}
                          >
                            Mint
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="flex items-center text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                              Outstanding USDA debt
                              <Tooltip
                                className="ml-2"
                                shouldWrapChildren={true}
                                label={`Includes a ${
                                  collateralType?.stabilityFeeApy / 100
                                }% yearly stability fee.`}
                              >
                                <StyledIcon
                                  as="InformationCircleIcon"
                                  size={5}
                                  className="block ml-2 text-gray-400"
                                />
                              </Tooltip>
                            </p>
                            {loadingFeesData || loadingVaultData ? (
                              <Placeholder
                                className="py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.THIRD}
                              />
                            ) : (
                              <p className="mt-1 text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                                {totalDebt.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                <span className="text-sm font-normal">USDA</span>
                              </p>
                            )}
                          </div>
                          {!loadingStackerData &&
                          isVaultOwner &&
                          canWithdrawCollateral &&
                          Number(vault?.stackedTokens) === 0 &&
                          Number(totalDebt) <= 3 ? (
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => setShowCloseModal(true)}
                            >
                              Withdraw Collateral & Close Vault
                            </button>
                          ) : !loadingStackerData && isVaultOwner ? (
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => setShowBurnModal(true)}
                            >
                              Pay back
                            </button>
                          ) : loadingStackerData ? (
                            <Placeholder
                              className="justify-end py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.THIRD}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {debtRatio > 0 ? (
                      <div className="mt-6">
                        <div>
                          {loadingVaultData ? (
                            <div className="p-4 border-l-4 border-gray-400 rounded-tr-md rounded-br-md bg-gray-50 dark:bg-gray-200">
                              <div className="flex">
                                <div className="w-5 h-5 bg-gray-300 rounded-full shrink-0" />
                                <div className="flex-1 ml-3">
                                  <Placeholder
                                    className="py-2"
                                    color={Placeholder.color.GRAY}
                                    width={Placeholder.width.HALF}
                                  />
                                  <Placeholder
                                    className="py-2"
                                    color={Placeholder.color.GRAY}
                                    width={Placeholder.width.THIRD}
                                  />
                                  <Placeholder
                                    className="py-2"
                                    color={Placeholder.color.GRAY}
                                    width={Placeholder.width.FULL}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* TODO: make component out of this */}
                              {debtClass(collateralType?.liquidationRatio, debtRatio) ==
                              'text-green-500' ? (
                                <Alert type={Alert.type.SUCCESS} title="Low liquidation risk">
                                  <p>
                                    Good job! Your vault looks quite healthy. Your liquidation price
                                    ({vault?.collateralToken} below{' '}
                                    <span className="font-semibold">${liquidationPrice()}</span>) is
                                    still very far but keep in mind that you can pay back the
                                    outstanding debt or deposit extra collateral at any time anyway.
                                  </p>
                                </Alert>
                              ) : debtClass(collateralType?.liquidationRatio, debtRatio) ==
                                'text-orange-500' ? (
                                <Alert type={Alert.type.WARNING} title="Medium liquidation risk">
                                  <p>
                                    Be careful. You will be liquidated if the{' '}
                                    {vault?.collateralToken} price drops below{' '}
                                    <span className="font-semibold">${liquidationPrice()} USD</span>
                                    . Pay back the outstanding debt or deposit extra collateral to
                                    keep your vault healthy.
                                  </p>
                                </Alert>
                              ) : (
                                <Alert type={Alert.type.ERROR} title="High liquidation risk">
                                  <p>
                                    You are very close to being liquidated. It will happen if the{' '}
                                    {vault?.collateralToken} price drops below{' '}
                                    <span className="font-semibold">${liquidationPrice()} USD</span>
                                    . Pay back the outstanding debt or deposit extra collateral to
                                    keep your vault healthy.
                                  </p>
                                </Alert>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-lg font-bold leading-6 text-gray-900 font-headings dark:text-zinc-50">
                  {canStackCollateral ? `Stacking` : `Manage`}
                </h3>

                {canStackCollateral && !loadingVaultData ? (
                  enabledStacking ? (
                    <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      <StyledIcon as="CheckCircleIcon" size={5} className="mr-2" />
                      Enabled
                    </span>
                  ) : (
                    <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                      <StyledIcon as="XCircleIcon" size={5} className="mr-2" />
                      Disabled
                    </span>
                  )
                ) : null}
              </div>

              {canStackCollateral ? (
                <div className="flex items-start justify-between">
                  <div>
                    {canStackCollateral &&
                    isVaultOwner &&
                    vault?.stackedTokens > 0 &&
                    !vault?.revokedStacking &&
                    !startedStacking &&
                    !loadingVaultData ? (
                      // cycle not started, offer to opt-out
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => callToggleStacking()}
                      >
                        Unstack
                      </button>
                    ) : canStackCollateral &&
                      isVaultOwner &&
                      vault?.stackedTokens > 0 &&
                      vault?.revokedStacking &&
                      !loadingVaultData ? (
                      // user has unstacked collateral, offer to stack again
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => callToggleStacking()}
                      >
                        Restack
                      </button>
                    ) : canStackCollateral &&
                      vault?.stackedTokens == 0 &&
                      isVaultOwner &&
                      !loadingVaultData ? (
                      // user is not stacking
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => stackCollateral()}
                      >
                        Stack
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <div className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <section>
                {canStackCollateral ? (
                  <div className="relative">
                    <div
                      className="absolute w-full h-full dark:opacity-30"
                      style={{
                        backgroundImage: 'url(/assets/stacks-pattern.png)',
                        backgroundSize: '20%',
                      }}
                    />
                    <a
                      className="absolute top-0 right-0 z-10 mt-2 mr-2 bg-indigo-600 rounded-full"
                      href="https://stacking.club/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="w-8 h-8" viewBox="0 0 120 120" aria-hidden="true">
                        <circle cx="60" cy="60" r="60" fill="#5546FF" />
                        <path
                          d="M86.0779 92L72.4991 71.4267H91.9992V63.6647H28V71.4357H47.4937L33.9214 92H44.0471L59.9997 67.8295L75.9522 92H86.0779ZM91.9993 56.1313V48.2912H72.8952L86.2874 28H76.1618L59.9995 52.4877L43.8375 28H33.7119L47.1212 48.3094H28V56.1313H91.9993Z"
                          fill="white"
                        />
                      </svg>
                    </a>

                    <dl className="relative grid grid-cols-1 overflow-hidden bg-indigo-100 bg-opacity-50 border border-indigo-200 divide-y divide-indigo-200 rounded-lg shadow-sm dark:bg-zinc-700 dark:bg-opacity-95 dark:border-zinc-600 dark:divide-zinc-600">
                      <div className="px-4 py-3">
                        <dt className="text-xs font-semibold text-indigo-600 uppercase dark:text-indigo-100">
                          Stacking Cycle #
                        </dt>
                        <dd className="flex items-baseline justify-between mt-1 md:block">
                          <div className="flex items-baseline justify-between flex-1 text-lg font-semibold text-indigo-800 dark:text-indigo-200">
                            {state.cycleNumber}
                          </div>
                        </dd>
                      </div>
                      <div className="px-4 py-3">
                        <dt className="text-xs font-semibold text-indigo-600 uppercase dark:text-indigo-100">
                          Days in cycle
                        </dt>
                        <dd className="flex items-baseline justify-between mt-1 md:block">
                          <div className="flex items-baseline justify-between flex-1 text-lg font-semibold text-indigo-800 dark:text-indigo-200">
                            <span>
                              {state.daysPassed}{' '}
                              <span className="text-xs opacity-80">(since {state.startDate})</span>
                            </span>
                            <a
                              className="hover:underline"
                              href={`https://mempool.space/block/${state.cycleStartHeight}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="text-xs">~#{state.cycleStartHeight}</span>
                            </a>
                          </div>
                        </dd>
                      </div>
                      <div className="px-4 py-3">
                        <dt className="text-xs font-semibold text-indigo-600 uppercase dark:text-indigo-100">
                          Days left
                        </dt>
                        <dd className="flex items-baseline justify-between mt-1 md:block">
                          <div className="flex items-baseline justify-between flex-1 text-lg font-semibold text-indigo-800 dark:text-indigo-200">
                            <span>
                              {state.daysLeft}{' '}
                              <span className="text-xs opacity-80">(ends on {state.endDate})</span>
                            </span>
                            <a
                              className="hover:underline"
                              href="https://mempool.space/"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="text-xs">~#{state.cycleEndHeight}</span>
                            </a>
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
                <div className={canStackCollateral ? `mt-3` : ``}>
                  <dl className="relative border border-gray-300 divide-y rounded-lg shadow-sm bg-zinc-200/30 dark:bg-gray-500 dark:border-gray-700">
                    <div className="px-4 py-3">
                      <dt className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">
                        Current Bitcoin block height
                      </dt>
                      <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                        <div className="justify-between font-semibold text-gray-600 dark:text-gray-50">
                          <a
                            className="hover:underline"
                            href="https://mempool.space/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            #{burnBlockHeight}
                          </a>
                        </div>
                      </dd>
                    </div>
                    <a
                      className="absolute top-0 right-0 z-10 mt-2 mr-2 rounded-full"
                      href="https://mempool.space/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        className="w-8 h-8 filter grayscale"
                        viewBox="0 0 120 120"
                        aria-hidden="true"
                      >
                        <path
                          fill="#F7931A"
                          d="M118.2 74.52a59.98 59.98 0 0 1-72.72 43.68 59.98 59.98 0 1 1 72.72-43.68Z"
                        />
                        <path
                          fill="#fff"
                          d="M86.46 51.45c1.2-7.98-4.89-12.27-13.2-15.14l2.7-10.81-6.59-1.64-2.63 10.53c-1.73-.43-3.5-.84-5.27-1.24l2.64-10.6-6.58-1.64-2.69 10.8-13.28-3.28-1.75 7.03s4.88 1.12 4.78 1.19c2.67.67 3.15 2.43 3.07 3.83L40.27 70.1c-.33.8-1.15 2.02-3.02 1.56.07.1-4.78-1.2-4.78-1.2L29.2 78l13.26 3.35-2.73 10.94 6.58 1.64 2.7-10.82c1.8.49 3.54.94 5.25 1.36l-2.7 10.77 6.59 1.64 2.73-10.92C72.1 88.1 80.55 87.24 84.1 77.1c2.86-8.17-.14-12.89-6.05-15.96 4.3-1 7.54-3.83 8.4-9.67h.01Zm-15.05 21.1c-2.04 8.17-15.8 3.75-20.26 2.64l3.61-14.49c4.46 1.11 18.77 3.32 16.65 11.85Zm2.04-21.21C71.6 58.78 60.14 55 56.42 54.07l3.27-13.15c3.72.93 15.7 2.66 13.76 10.42"
                        />
                      </svg>
                    </a>
                  </dl>
                </div>
              </section>
              <div className="sm:col-span-2">
                <div className="bg-white rounded-md shadow dark:bg-zinc-800">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-normal leading-6 text-gray-500 dark:text-zinc-400">
                          Total Locked
                        </p>
                        <p className="mt-1 text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                          {collateralLocked()}{' '}
                          <span className="text-sm font-normal">
                            {vault?.collateralToken.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center">
                        {isVaultOwner &&
                        canUnlockCollateral &&
                        vault?.stackedTokens > 0 &&
                        !loadingVaultData ? (
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 text-sm font-semibold leading-4 text-indigo-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onClick={() => unlockCollateral()}
                          >
                            <StyledIcon as="LockOpenIcon" size={4} className="-ml-0.5 mr-2" />
                            Unlock
                          </button>
                        ) : null}

                        {isVaultOwner && !loadingVaultData ? (
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 ml-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowDepositModal(true)}
                          >
                            Deposit
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {canStackCollateral ? (
                      <PoxTimeline
                        unlockBurnHeight={unlockBurnHeight}
                        currentBurnHeight={burnBlockHeight}
                        isLoading={loadingStackerData}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 bg-white divide-y divide-gray-200 shadow dark:bg-zinc-800 dark:divide-zinc-600 sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    {loadingStackerData || loadingVaultData ? (
                      <>
                        <div className="flex justify-between flex-1 mt-3">
                          <Placeholder
                            color={Placeholder.color.GRAY}
                            width={Placeholder.width.FULL}
                          />
                          <Placeholder
                            className="justify-end"
                            color={Placeholder.color.INDIGO}
                            width={Placeholder.width.THIRD}
                          />
                        </div>
                        <div className="flex justify-between flex-1 mt-4">
                          <Placeholder
                            color={Placeholder.color.GRAY}
                            width={Placeholder.width.FULL}
                          />
                          <Placeholder
                            className="justify-end"
                            color={Placeholder.color.INDIGO}
                            width={Placeholder.width.THIRD}
                          />
                        </div>
                      </>
                    ) : canStackCollateral ? (
                      <div>
                        <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                          <div className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                            {unlockBurnHeight == 0 ? (
                              <>
                                <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                  Available for stacking
                                </p>
                                <Tooltip shouldWrapChildren={true} label={`...`}>
                                  <StyledIcon
                                    as="InformationCircleIcon"
                                    size={5}
                                    className="block ml-2 text-gray-400"
                                  />
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                  Currently stacking
                                </p>
                                <Tooltip
                                  shouldWrapChildren={true}
                                  label={`The amount of STX that is currently stacking or will be stacking after your cooldown cycle`}
                                >
                                  <StyledIcon
                                    as="InformationCircleIcon"
                                    size={5}
                                    className="block ml-2 text-gray-400"
                                  />
                                </Tooltip>
                              </>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                            <p className="text-lg font-semibold leading-none">
                              {enabledStacking ? (
                                <span>{microToReadable(vault?.collateral)} </span>
                              ) : (
                                <span>0 </span>
                              )}
                              <span className="text-sm font-normal">
                                {vault?.collateralToken.toUpperCase()}
                              </span>
                            </p>
                          </div>
                        </div>

                        {enabledStacking && stackingEndDate != '' ? (
                          <div className="mt-4 sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                            <div className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                              <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                End of stacking
                              </p>
                              <Tooltip
                                shouldWrapChildren={true}
                                label={`The yield on your vault is given when stacking ends. If you opt-out of stacking, you can withdraw your funds when stacking ends.`}
                              >
                                <StyledIcon
                                  as="InformationCircleIcon"
                                  size={5}
                                  className="block ml-2 text-gray-400"
                                />
                              </Tooltip>
                            </div>
                            <div className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                              <p className="text-lg font-semibold leading-none">
                                {stackingEndDate}
                              </p>
                            </div>
                          </div>
                        ) : unlockBurnHeight == 0 ? (
                          <div className="mt-4 sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                            <div className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                              <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                Stacking starts in
                              </p>
                            </div>
                            <div className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                              <p className="text-lg font-semibold leading-none">
                                {state.daysLeft} days
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {canStackCollateral ? (
                      <>
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <p className="flex items-center text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                              Rewards
                              <Tooltip
                                className="ml-2"
                                shouldWrapChildren={true}
                                label={`The amount of yield that your vault has earned so far`}
                              >
                                <StyledIcon
                                  as="InformationCircleIcon"
                                  size={5}
                                  className="block ml-2 text-gray-400"
                                />
                              </Tooltip>
                            </p>
                            {loadingPoxYieldData ? (
                              <Placeholder
                                className="py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.THIRD}
                              />
                            ) : (
                              <>
                                <p className="mt-1 text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                                  {poxYield}{' '}
                                  <span className="text-sm font-normal">
                                    {vault?.collateralToken.toUpperCase()}
                                  </span>
                                </p>
                                <p className="mt-1 text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                                  {usdaYield}{' '}
                                  <span className="text-sm font-normal">
                                    USDA
                                  </span>
                                </p>
                              </>
                            )}
                          </div>
                          {poxYield != 0 || usdaYield != 0 ? (
                            <div>
                              {poxYield != 0 ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  onClick={() => claimYield()}
                                >
                                  Add as collateral
                                </button>
                              ) : null}
                              {usdaYield != 0 ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-3 py-2 ml-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  onClick={() => claimYieldPayDebt()}
                                >
                                  Claim USDA and burn debt
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : null}

                    <div
                      className={
                        canStackCollateral
                          ? `flex items-center justify-between mt-4`
                          : `flex items-center justify-between`
                      }
                    >
                      <div>
                        <p className="flex items-center text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                          Withdrawal
                          <Tooltip
                            className="ml-2"
                            shouldWrapChildren={true}
                            label={`The amount of collateral you are able to withdraw while keeping a healthy collateralization level`}
                          >
                            <StyledIcon
                              as="InformationCircleIcon"
                              size={5}
                              className="block ml-2 text-gray-400"
                            />
                          </Tooltip>
                        </p>
                        {loadingVaultData ? (
                          <Placeholder
                            className="py-2"
                            color={Placeholder.color.INDIGO}
                            width={Placeholder.width.THIRD}
                          />
                        ) : (
                          <p className="mt-1 text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                            {maximumCollateralToWithdraw}{' '}
                            <span className="text-sm font-normal">
                              {vault?.collateralToken.toUpperCase()}
                            </span>
                          </p>
                        )}
                      </div>
                      {isVaultOwner &&
                      canWithdrawCollateral &&
                      !loadingVaultData &&
                      maximumCollateralToWithdraw > 0 &&
                      totalDebt > 0 ? (
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => setShowWithdrawModal(true)}
                        >
                          Withdraw
                        </button>
                      ) : null}
                    </div>

                    {loadingVaultData ? (
                      <div className="mt-6">
                        <Alert>
                          <Placeholder
                            className="py-2"
                            color={Placeholder.color.INDIGO}
                            width={Placeholder.width.FULL}
                          />
                          <Placeholder
                            className="py-2"
                            color={Placeholder.color.INDIGO}
                            width={Placeholder.width.FULL}
                          />
                        </Alert>
                      </div>
                    ) : canStackCollateral &&
                      isVaultOwner &&
                      vault?.stackedTokens > 0 &&
                      !vault?.revokedStacking ? (
                      // user has indicated they want to stack their tokens
                      <div className="mt-6">
                        <Alert>
                          {startedStacking && burnBlockHeight > unlockBurnHeight ? (
                            <p>
                              You can stop stacking and withdraw your collateral by unlocking your
                              vault with the above Unlock button.
                            </p>
                          ) : startedStacking ? (
                            <p>
                              You cannot withdraw your collateral since it is stacked until Bitcoin
                              block {unlockBurnHeight}. We are currently at Bitcoin block{' '}
                              {burnBlockHeight}. After block {unlockBurnHeight} gets mined, you will
                              need to manually unlock your vault to get access to your collateral.
                            </p>
                          ) : (
                            <p>
                              The next stacking cycle has not started yet. You can still choose to
                              opt-out of stacking your STX tokens. If you do so, you will not earn a
                              yield on your vault.
                            </p>
                          )}
                        </Alert>
                      </div>
                    ) : canStackCollateral &&
                      isVaultOwner &&
                      vault?.stackedTokens > 0 &&
                      vault?.revokedStacking ? (
                      <div className="mt-4">
                        <Alert>
                          <p>
                            You have unstacked your collateral. It is still stacking in PoX until
                            Bitcoin block {unlockBurnHeight}. Once your cooldown cycle hits, you can
                            unlock the collateral.
                          </p>
                        </Alert>
                      </div>
                    ) : canStackCollateral && isVaultOwner ? (
                      <div className="mt-4">
                        <Alert>
                          <p>You are not stacking your collateral.</p>
                        </Alert>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Container>
  );
};
