import React, { useContext, useEffect, useState } from 'react';
import { Tooltip } from '@blockstack/ui';
import { InformationCircleIcon } from '@heroicons/react/solid';
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
        senderAddress: senderAddress || '',
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
          contractName: 'arkadiko-collateral-types-v1-1',
          functionName: 'get-collateral-type-by-name',
          functionArgs: [stringAsciiCV(data['collateral-type'].value)],
          senderAddress: senderAddress || '',
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
            collateralType?.collateralToDebtRatio
          )
        );
      } else {
        setMaximumCollateralToWithdraw(0);
      }
    }
  }, [collateralType?.collateralToDebtRatio, price]);

  useEffect(() => {
    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-stability-fee-for-vault',
        functionArgs: [
          uintCV(vault?.id),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v1-1'),
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
            contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v1-1'),
            contractPrincipalCV(contractAddress || '', 'arkadiko-oracle-v1-1'),
            falseCV(),
          ],
          senderAddress: senderAddress || '',
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
      const currentBurnHeight = data['stable_burn_block_height'];

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
      if (vault['collateralType'].toLowerCase().includes('stx')) {
        setCanStackCollateral(true);
      }
      setDecimals(vault['collateralType'].toLowerCase().includes('stx') ? 1000000 : 100000000);
      fetchFees();
      fetchStackerHeight();
      fetchYield();
      fetchCollateralToDebtRatio();
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
        vault['collateralType']
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
          'arkadiko-collateral-types-v1-1'
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
      contractName: 'arkadiko-claim-yield-v2-1',
      functionName: 'claim-to-pay-debt',
      postConditionMode: 0x01,
      functionArgs: [
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
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

  return (
    <Container>
      {auctionEnded && <Redirect to="/vaults" />}

      <VaultDepositModal
        showDepositModal={showDepositModal}
        setShowDepositModal={setShowDepositModal}
        match={match}
        vault={vault}
        reserveName={reserveName}
        decimals={decimals}
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
            <h2 className="text-xl font-bold leading-6 text-gray-900 font-headings dark:text-zinc-50">
              {loadingVaultData ? (
                <Placeholder
                  className="py-2"
                  color={Placeholder.color.GRAY}
                  width={Placeholder.width.HALF}
                />
              ) : (
                <>
                  {vault?.collateralToken.toUpperCase()}/USDA Vault #{match.params.id}
                </>
              )}
            </h2>
          </header>

          <div className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mt-4 bg-white divide-y divide-gray-200 shadow dark:bg-zinc-900 dark:divide-zinc-600 sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-2xl font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Supply
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                      Manage and deposit extra collateral.
                    </p>
                  </div>
                  <div className="px-4 py-5 space-y-6 bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600 sm:p-6">
                    <div className="flex items-start justify-between">
                      {loadingVaultData ? (
                        <div className="flex flex-col flex-1">
                          <Placeholder
                            className="py-1.5"
                            color={Placeholder.color.INDIGO}
                            width={Placeholder.width.HALF}
                          />
                          <Placeholder
                            className="py-1.5"
                            color={Placeholder.color.GRAY}
                            width={Placeholder.width.THIRD}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                            {collateralLocked()}{' '}
                            <span className="text-sm font-normal">
                              {vault?.collateralToken.toUpperCase()}
                            </span>
                          </p>
                          <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                            {vault?.collateralToken.toUpperCase()} Locked
                          </p>
                        </div>
                      )}

                      {isVaultOwner && !loadingVaultData ? (
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => setShowDepositModal(true)}
                        >
                          Deposit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-white divide-y divide-gray-200 shadow dark:bg-zinc-900 dark:divide-zinc-600 sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-2xl font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">
                            Stacking
                          </h3>
                          {canStackCollateral && !loadingVaultData ? (
                            <Tooltip
                              className="ml-2"
                              shouldWrapChildren={true}
                              label={`Stacking is ${enabledStacking ? 'enabled' : 'disabled'}`}
                            >
                              <span className="relative flex w-3 h-3 ml-2">
                                {enabledStacking ? (
                                  <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
                                ) : null}
                                <span
                                  className={`relative inline-flex rounded-full h-3 w-3 ${
                                    enabledStacking ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                ></span>
                              </span>
                            </Tooltip>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Update your stacking status.</p>
                      </div>
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
                          isVaultOwner ? (
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => callToggleStacking()}
                            >
                              Restack
                            </button>
                          ) : null
                        ) : canStackCollateral && isVaultOwner && !loadingVaultData ? (
                          // user is not stacking
                          isVaultOwner ? (
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => stackCollateral()}
                            >
                              Stack
                            </button>
                          ) : null
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {loadingStackerData || loadingVaultData ? (
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between flex-1">
                        <Placeholder
                          className="py-2"
                          color={Placeholder.color.GRAY}
                          width={Placeholder.width.HALF}
                        />
                        <Placeholder
                          className="justify-end py-2"
                          color={Placeholder.color.INDIGO}
                          width={Placeholder.width.THIRD}
                        />
                      </div>
                      <div className="flex justify-between flex-1 mt-4">
                        <Placeholder
                          className="py-2"
                          color={Placeholder.color.GRAY}
                          width={Placeholder.width.HALF}
                        />
                        <Placeholder
                          className="justify-end py-2"
                          color={Placeholder.color.INDIGO}
                          width={Placeholder.width.THIRD}
                        />
                      </div>
                    </div>
                  ) : canStackCollateral ? (
                    <div className="px-4 py-5 space-y-6 bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600 sm:p-6">
                      <dl>
                        <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                          <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                            {unlockBurnHeight == 0 ? (
                              <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                Will be stacked
                              </p>
                            ) : (
                              <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                Currently stacking
                              </p>
                            )}
                          </dt>
                          <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                            <p className="text-lg font-semibold leading-none">
                              {enabledStacking ? (
                                <span>{microToReadable(vault?.collateral)}{' '}</span>
                              ) : (
                                <span>0{' '}</span>
                              )}
                              <span className="text-sm font-normal">
                                {vault?.collateralToken.toUpperCase()}
                              </span>
                            </p>
                          </dd>
                        </div>
                        <div className="mt-4 sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                          {enabledStacking && stackingEndDate != '' ? (
                            <>
                              <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                                <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                  End of stacking
                                </p>
                                <Tooltip
                                  shouldWrapChildren={true}
                                  label={`The yield on your vault is given when stacking ends. If you opt-out of stacking, you can withdraw your funds when stacking ends.`}
                                >
                                  <InformationCircleIcon
                                    className="block w-5 h-5 ml-2 text-gray-400"
                                    aria-hidden="true"
                                  />
                                </Tooltip>
                              </dt>
                              <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                                <p className="text-lg font-semibold leading-none">
                                  {stackingEndDate}
                                </p>
                              </dd>
                            </>
                          ) : unlockBurnHeight == 0 ? (
                            <>
                              <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                                <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                                  Stacking starts in
                                </p>
                              </dt>
                              <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                                <p className="text-lg font-semibold leading-none">
                                  {state.daysLeft} days
                                </p>
                              </dd>
                            </>
                          ) : null}
                        </div>
                      </dl>
                    </div>
                  ) : null}

                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">
                        Yield
                      </h4>

                      {poxYield != 0 ? (
                        <div>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => claimYield()}
                          >
                            Add as collateral
                          </button>
                          {false ? (
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 ml-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => claimYieldPayDebt()}
                            >
                              Pay back debt
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <dl className="mt-4">
                      <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                        <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                          <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                            Available yield
                          </p>
                        </dt>
                        <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                          {loadingPoxYieldData ? (
                            <Placeholder
                              className="justify-end py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.THIRD}
                            />
                          ) : (
                            <p className="text-lg font-semibold leading-none">
                              {poxYield}{' '}
                              <span className="text-sm font-normal">
                                {vault?.collateralToken.toUpperCase()}
                              </span>
                            </p>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">
                        Withdrawal
                      </h4>
                      {isVaultOwner &&
                      canWithdrawCollateral &&
                      !loadingVaultData &&
                      totalDebt > 0 ? (
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => setShowWithdrawModal(true)}
                        >
                          Withdraw
                        </button>
                      ) : null}
                      {isVaultOwner &&
                      canUnlockCollateral &&
                      vault?.stackedTokens > 0 &&
                      !loadingVaultData ? (
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => unlockCollateral()}
                        >
                          Unlock Collateral
                        </button>
                      ) : null}
                    </div>

                    <dl className="mt-4">
                      <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                        <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                          <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                            Able to withdraw
                          </p>
                        </dt>
                        <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                          {loadingVaultData ? (
                            <Placeholder
                              className="justify-end py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.THIRD}
                            />
                          ) : (
                            <p className="text-lg font-semibold leading-none">
                              {maximumCollateralToWithdraw}{' '}
                              <span className="text-sm font-normal">
                                {vault?.collateralToken.toUpperCase()}
                              </span>
                            </p>
                          )}
                        </dd>
                      </div>
                    </dl>

                    {loadingVaultData ? (
                      <div className="mt-4">
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
                      // user has indicated they want to stack their STX tokens
                      <div className="mt-4">
                        <Alert>
                          {startedStacking ? (
                            <p>
                              You cannot withdraw your collateral since it is stacked until Bitcoin
                              block {unlockBurnHeight}. After this block gets mined, you will need to
                              manually unlock your vault to get access to your collateral.
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
                            You have unstacked your collateral. It is still stacking in PoX until Bitcoin block {unlockBurnHeight}. Once your cooldown cycle hits, you can unlock the collateral.
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
              <div>
                <div className="mt-4 bg-white divide-y divide-gray-200 shadow dark:bg-zinc-900 dark:divide-zinc-600 sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-2xl font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Mint
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                      Manage your loan. Get extra USDA. Pay it back.
                    </p>
                  </div>
                  <div className="relative px-4 py-5 space-y-6 bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-600 sm:p-6">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          {loadingVaultData ? (
                            <Placeholder
                              className="py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.THIRD}
                            />
                          ) : (
                            <p className="text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                              {availableCoinsToMint(
                                price,
                                collateralLocked(),
                                outstandingDebt(),
                                collateralType?.collateralToDebtRatio,
                                vault?.collateralToken
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}{' '}
                              <span className="text-sm font-normal">USDA</span>
                            </p>
                          )}
                          <p className="flex items-center text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                            Available to mint
                            <Tooltip
                              className="ml-2"
                              shouldWrapChildren={true}
                              label={`When the price of ${vault?.collateralToken.toUpperCase()} increases compared to when you created a vault, your collateral is bigger in dollar value so you can mint more.`}
                            >
                              <InformationCircleIcon
                                className="block w-5 h-5 ml-2 text-gray-400"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </p>
                        </div>
                        {isVaultOwner &&
                        !loadingVaultData &&
                        Number(
                          availableCoinsToMint(
                            price,
                            collateralLocked(),
                            outstandingDebt(),
                            collateralType?.collateralToDebtRatio,
                            vault?.collateralToken
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
                            {loadingFeesData || loadingVaultData ? (
                              <Placeholder
                                className="py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.THIRD}
                              />
                            ) : (
                              <p className="text-lg font-semibold leading-none text-gray-900 dark:text-zinc-100">
                                {totalDebt.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                <span className="text-sm font-normal">USDA</span>
                              </p>
                            )}
                            <p className="flex items-center text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                              Outstanding USDA debt
                              <Tooltip
                                className="ml-2"
                                shouldWrapChildren={true}
                                label={`Includes a ${
                                  collateralType?.stabilityFeeApy / 100
                                }% yearly stability fee.`}
                              >
                                <InformationCircleIcon
                                  className="block w-5 h-5 ml-2 text-gray-400"
                                  aria-hidden="true"
                                />
                              </Tooltip>
                            </p>
                          </div>
                          {!loadingStackerData && isVaultOwner && canWithdrawCollateral && Number(vault?.stackedTokens) === 0 && Number(totalDebt) <= 0.1 ? (
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
                    <div className="pt-6">
                      <dl>
                        <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                          <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                            <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                              Collateral to Debt ratio
                            </p>
                            <Tooltip
                              shouldWrapChildren={true}
                              label={`The amount of collateral you deposit in a vault versus the stablecoin debt you are minting against it`}
                            >
                              <InformationCircleIcon
                                className="block w-5 h-5 ml-2 text-gray-400"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </dt>
                          <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                            {loadingVaultData ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.THIRD}
                              />
                            ) : (
                              <p
                                className={`text-lg font-semibold leading-none ${debtClass(
                                  collateralType?.liquidationRatio,
                                  debtRatio
                                )}`}
                              >
                                {debtRatio}
                                <span className="text-sm font-normal">%</span>
                              </p>
                            )}
                          </dd>
                        </div>

                        <div className="mt-4 sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                          <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                            <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                              Minimum Ratio (before liquidation)
                            </p>
                            <Tooltip
                              shouldWrapChildren={true}
                              label={`The collateral-to-debt ratio when your vault gets liquidated`}
                            >
                              <InformationCircleIcon
                                className="block w-5 h-5 ml-2 text-gray-400"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </dt>
                          <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                            {loadingVaultData ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.THIRD}
                              />
                            ) : (
                              <p className="text-lg font-semibold leading-none">
                                {collateralType?.liquidationRatio}
                                <span className="text-sm font-normal">%</span>
                              </p>
                            )}
                          </dd>
                        </div>

                        <div className="mt-4 sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto">
                          <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                            <p className="text-base font-normal leading-6 text-gray-500 dark:text-zinc-400">
                              Liquidation penalty
                            </p>
                            <Tooltip
                              shouldWrapChildren={true}
                              label={`The penalty you pay when your vault gets liquidated`}
                            >
                              <InformationCircleIcon
                                className="block w-5 h-5 ml-2 text-gray-400"
                                aria-hidden="true"
                              />
                            </Tooltip>
                          </dt>
                          <dd className="mt-1 text-sm text-right text-gray-900 dark:text-zinc-100 sm:mt-0">
                            {loadingVaultData ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.THIRD}
                              />
                            ) : (
                              <p className="text-lg font-semibold leading-none">
                                {collateralType?.liquidationPenalty}
                                <span className="text-sm font-normal">%</span>
                              </p>
                            )}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4">
                        <Alert>
                          {loadingVaultData ? (
                            <div className="flex flex-col flex-1">
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
                            </div>
                          ) : (
                            <p>
                              The current {vault?.collateralToken} price is{' '}
                              <span className="font-semibold text-blue-900">
                                ${price / 1000000} USD
                              </span>
                              . You will be liquidated if the {vault?.collateralToken} price drops
                              below{' '}
                              <span className="font-semibold text-blue-900">
                                ${liquidationPrice()} USD
                              </span>
                              . Pay back the outstanding debt or deposit extra collateral to keep
                              your vault healthy.
                            </p>
                          )}
                        </Alert>
                      </div>
                    </div>
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
