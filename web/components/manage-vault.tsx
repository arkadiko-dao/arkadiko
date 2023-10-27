import React, { useContext, useEffect, useState } from 'react';
import { Tooltip } from '@blockstack/ui';
import { Container } from './home';
import { VaultDeposit } from '@components/vault-deposit';
import { VaultWithdraw } from '@components/vault-withdraw';
import { VaultMint } from '@components/vault-mint';
import { VaultBurn } from '@components/vault-burn';
import { VaultCloseModal } from '@components/vault-close-modal';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import {
  AnchorMode,
  uintCV,
  stringAsciiCV,
  standardPrincipalCV,
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
import { getRPCClient } from '@common/utils';
import { microToReadable, availableCollateralToWithdraw } from '@common/vault-utils';
import { addMinutes } from 'date-fns';
import { Placeholder } from './ui/placeholder';
import { Alert } from './ui/alert';
import { PoxTimeline } from '@components/pox-timeline';
import { StyledIcon } from './ui/styled-icon';
import { Status } from './ui/health-status';

export const ManageVault = ({ match }) => {
  const senderAddress = useSTXAddress();
  const [state, setState] = useContext(AppContext);
  const [{ collateralTypes }, _x] = useContext(AppContext);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const vaultOwner = match.params.owner;
  const collateralSymbol = match.params.collateral;

  const [showCloseModal, setShowCloseModal] = useState(false);

  const [maximumCollateralToWithdraw, setMaximumCollateralToWithdraw] = useState(0);
  const [reserveName, setReserveName] = useState('');
  const [vault, setVault] = useState<VaultProps>();
  const [price, setPrice] = useState(0);
  const [debtRatio, setDebtRatio] = useState(0);
  const [collateralType, setCollateralType] = useState<CollateralTypeProps>();
  const [isVaultOwner, setIsVaultOwner] = useState(false);
  const [stabilityFee, setStabilityFee] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [decimals, setDecimals] = useState(1000000);

  const [loadingVaultData, setLoadingVaultData] = useState(true);
  const [loadingFeesData, setLoadingFeesData] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
      const serializedVault = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vaults-data-v1-1',
        functionName: 'get-vault',
        functionArgs: [standardPrincipalCV(vaultOwner), contractPrincipalCV(contractAddress, 'wstx-token')], // TODO
        senderAddress: senderAddress || contractAddress,
        network: network,
      });

      const data = cvToJSON(serializedVault).value.value;

      if (data['status'] !== 0) {
        setVault({
          owner: vaultOwner,
          collateral: data['collateral'].value,
          collateralToken: collateralSymbol,
          collateralType: collateralSymbol,
          isLiquidated: false,
          debt: data['debt'].value,
          status: data['status'].value
        });
        console.log('lollzz', data);
        setIsVaultOwner(vaultOwner === senderAddress);

        const price = await getPrice(collateralSymbol);
        setPrice(price);
        setLoadingVaultData(false);
      }
    };
    fetchVault();
  }, [match.params.owner, match.params.collateral]);

  useEffect(() => {
    setCollateralType(collateralTypes[collateralSymbol]);
  }, [collateralTypes, collateralSymbol]);

  useEffect(() => {
    if (vault?.status && collateralType?.collateralToDebtRatio && price > 0) {
      setMaximumCollateralToWithdraw(
        availableCollateralToWithdraw(
          price,
          collateralLocked(),
          outstandingDebt(),
          collateralType?.collateralToDebtRatio,
          vault?.collateralToken
        )
      );
    }
  }, [collateralType?.collateralToDebtRatio, price, vault?.status]);

  useEffect(() => {
    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vaults-helpers-v1-1',
        functionName: 'get-stability-fee',
        functionArgs: [
          contractPrincipalCV(
            process.env.REACT_APP_CONTRACT_ADDRESS || '',
            'arkadiko-vaults-tokens-v1-1'
          ),
          contractPrincipalCV(
            process.env.REACT_APP_CONTRACT_ADDRESS || '',
            'arkadiko-vaults-data-v1-1'
          ),
          standardPrincipalCV(vaultOwner),
          contractPrincipalCV(contractAddress, 'wstx-token') // TODO: make dynamic
        ],
        senderAddress: contractAddress || '',
        network: network,
      });

      const fee = cvToJSON(feeCall);
      setStabilityFee(fee.value.value);
      setTotalDebt(outstandingDebt() + fee.value.value / 1000000);
      setLoadingFeesData(false);
    };

    console.log('GOT VAULT:', vault);
    if (vault?.status && price > 0) {
      const decimals = ['stx', 'xbtc', 'btc'].includes(collateralSymbol.toLowerCase()) ? 1000000 : 100000000;
      setDecimals(decimals);
      fetchFees();
      console.log('FETCHING COLL TO DEBT...', vault['debt'], vault['collateral'], price);
      setDebtRatio(100.0 * vault['collateral'] * price / vault['debt'] / decimals);
    }
  }, [vault, price]);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  const liquidationPrice = () => {
    if (vault) {
      // (liquidationRatio * coinsMinted) / collateral = rekt
      return getLiquidationPrice(
        collateralType?.liquidationRatio / 100.0,
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

  const vaultDetails = {
    primary: [
      {
        label: 'Collateral to Debt ratio',
        help: 'The amount of collateral you deposit in a vault versus the stablecoin debt you are minting against it',
        data: debtRatio,
        unit: '%'
      },
      {
        label: 'Collateral amount',
        help: 'The amount of collateral you deposited in this vault',
        data: collateralLocked(),
        unit: vault?.collateralToken.toUpperCase()
      },
      {
        label: 'Outstanding debt',
        help: `Your total debt including a ${collateralType?.stabilityFeeApy / 100}% yearly stability fee.`,
        data: totalDebt.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }),
        unit: 'USDA'
      },
      {
        label: 'Stability fee amount',
        help: 'The interest fee on your USDA loan',
        data: stabilityFee / 1000000,
        unit: 'USDA'
      }
    ],
    secondary: [
      {
        label: 'Minimum Ratio (before liquidation)',
        help: 'The collateral-to-debt ratio when your vault gets liquidated',
        data: collateralType?.liquidationRatio / 100.0,
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
        data: 4,
        unit: '%'
      },
      {
        label: 'Redemption fee',
        help: '--',
        data: '20',
        unit: '%'
      }
    ]
  };

  return (
    <Container>

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
                  <div className="flex items-center gap-x-4">
                    <div className={`flex items-center justify-center w-16 h-16 shrink-0 bg-white/80 rounded-md border border-gray-400/30`}>
                      {/* @TODO: pass token logo */}
                      <img className="w-10 h-10" src="/assets/tokens/stx.svg" alt="" />
                    </div>
                    <div>
                      {/* @TODO pass tolen name */}
                      <div className="mb-2">STX</div>
                      {debtRatio > 0 ? (
                        loadingVaultData ? (
                          <Placeholder
                            className="justify-end py-2"
                            color={Placeholder.color.GRAY}
                            width={Placeholder.width.THIRD}
                          />
                        ) : (
                          <>
                            {debtClass(collateralType?.liquidationRatio / 100.0, debtRatio) == 'text-green-500' ? (
                              <Status
                                type={Status.type.SUCCESS }
                                label='Healthy'
                                labelHover='Low liquidation risk'
                              />
                            ) : debtClass(collateralType?.liquidationRatio / 100.0, debtRatio) == 'text-orange-500' ? (
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
                  </div>
                )}
              </h2>

            </div>
          </header>

          <div className="mt-4" id="liquidation-status-alert">
            <div className={`flex flex-col rounded-md bg-white dark:bg-zinc-800 shadow`}>
              <h3 className="text-base font-normal leading-6 text-gray-900 sr-only font-headings dark:text-zinc-50">
                Vault details
              </h3>
              <div className="flex flex-col h-full p-4">
                <div className="space-y-2 lg:grid md:items-center lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {/* @TODO: pass bg-TOKEN class */}
                  <div className="flex flex-col items-center h-full px-4 py-5 mb-4 border rounded-lg sm:mb-0 bg-STX bg-opacity-10 border-STX/20">
                    <dl className="flex-1 w-full space-y-2">
                      {vaultDetails.primary.map(detail => (
                        <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto" key={detail.label}>
                        <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                          <p className="text-sm font-semibold text-STX dark:text-indigo-200">
                            {detail.label}
                          </p>
                            <Tooltip
                              shouldWrapChildren={true}
                              label={detail.help}
                            >
                              <StyledIcon
                                as="InformationCircleIcon"
                                size={4}
                                className="block ml-2 text-STX/80 dark:brightness-100 dark:text-gray-400"
                              />
                            </Tooltip>
                          </dt>
                          <dd className="mt-1 text-sm text-right sm:mt-0">
                            {loadingVaultData ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.INDIGO}
                                width={Placeholder.width.FULL}
                              />
                            ) : (
                              <p
                                className="text-base font-semibold leading-none"
                              >
                                {detail.label === 'Collateral to Debt ratio' ? (
                                  <>
                                    <span className="flex items-center justify-end">
                                      {/* @TODO: Change icon according to collateral to debt ratio - (SUCCESS, WARNING, DANGER) */}
                                      <Status
                                        type={Status.type.SUCCESS}
                                      />
                                      <span className="ml-2 text-STX brightness-50 dark:brightness-100 dark:text-zinc-100">{detail.data}</span>
                                      <span className="text-STX brightness-50 dark:brightness-100 dark:text-zinc-100 text-sm font-normal ml-0.5">
                                        {detail.unit}
                                      </span>
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-STX brightness-50 dark:brightness-100 dark:text-zinc-100">{detail.data}</span>
                                    <span className="text-STX brightness-50 dark:brightness-100 dark:text-zinc-100 text-sm font-normal ml-0.5">
                                      {detail.unit}
                                    </span>
                                  </>
                                )}


                              </p>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <dl className="space-y-1.5 lg:ml-6">
                    {vaultDetails.secondary.map(detail => (
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
                          {/* {loadingVaultData ? (
                            <Placeholder
                              className="justify-end py-2"
                              color={Placeholder.color.INDIGO}
                              width={Placeholder.width.FULL}
                            />
                          ) : (
                            <> */}
                              {detail.label === 'Collateral to Debt ratio' ? (
                                <p
                                  className={`text-base font-semibold leading-none ${debtClass(
                                    collateralType?.liquidationRatio / 100.0,
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
                                    {detail.unit}
                                  </span>
                                </p>
                              )}
                            {/* </>
                          )} */}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {debtRatio > 0 ? (
                <div className="px-4 pt-0 pb-4 lg:grid lg:grid-cols-3 lg:gap-4">
                  <div className="md:col-span-2">
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
                        {debtClass(collateralType?.liquidationRatio / 100.0, debtRatio) ==
                        'text-green-500' ? (
                          <Alert type={Alert.type.SUCCESS} title="Low liquidation risk">
                            <p>
                              Good job! Your vault looks quite healthy. Your liquidation price
                              ({vault?.collateralToken} below{' '}
                              <span className="font-semibold">${liquidationPrice()}</span>) is
                              still very far.
                            </p>
                            <p>Feel free to pay back your debt or deposit extra collateral anytime.</p>
                          </Alert>
                        ) : debtClass(collateralType?.liquidationRatio / 100.0, debtRatio) ==
                          'text-orange-500' ? (
                          <Alert type={Alert.type.WARNING} title="Medium liquidation risk">
                            <p>
                              Be careful. You will be liquidated if the{' '}
                              {vault?.collateralToken} price drops below{' '}
                              <span className="font-semibold">${liquidationPrice()} USD</span>.
                            </p>
                            <p>
                              Pay back your debt or deposit extra collateral to
                              keep your vault healthy.
                            </p>
                          </Alert>
                        ) : (
                          <Alert type={Alert.type.ERROR} title="High liquidation risk">
                            <p>
                              You are very close to being liquidated. It will happen if the{' '}
                              {vault?.collateralToken} price drops below{' '}
                              <span className="font-semibold">${liquidationPrice()} USD</span>.
                            </p>
                            <p>
                              Pay back the outstanding debt or deposit extra collateral to
                              keep your vault healthy.
                            </p>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>

                  <div className="relative flex items-center justify-between gap-6 p-3 overflow-hidden border border-gray-100 rounded-md bg-gradient-to-l from-gray-50 to-gray-200/80">
                    <div>
                      <p className="text-sm font-semibold leading-none text-gray-500">
                        Current {vault?.collateralToken} price
                        <span className="block mt-1 text-xs text-gray-400 dark:text-gray-500">(based on the oracle price)</span>
                      </p>
                      <p className="mt-2.5 text-xl font-semibold text-gray-900">${price / decimals}</p>
                    </div>
                    <div className="p-2 bg-gray-200 dark:bg-gray-300 rounded-3xl">
                      <svg className="text-gray-400 w-14 h-14" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 120 120">
                        <path fill="currentColor" d="M86.078 92 72.499 71.427H92v-7.762H28v7.77h19.494L33.92 92h10.126L60 67.83 75.952 92h10.126Zm5.921-35.869v-7.84H72.895L86.287 28H76.162L59.999 52.488 43.837 28H33.712l13.41 20.31H28v7.821h64Z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="bg-white rounded-md shadow dark:bg-zinc-800">
                <div className="divide-x divide-gray-200 dark:divide-gray-700 lg:grid lg:grid-cols-2 lg:gap-4">
                  <div className="flex flex-col px-4 py-5 sm:p-6">
                    <VaultMint
                      match={match}
                      vault={vault}
                      reserveName={reserveName}
                      price={price}
                      collateralType={collateralType}
                    />
                  </div>
                  <div className="flex flex-col px-4 py-5 sm:p-6">
                    <VaultBurn
                      outstandingDebt={outstandingDebt}
                      stabilityFee={stabilityFee}
                      match={match}
                      vault={vault}
                      reserveName={reserveName}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <h3 className="text-lg font-bold leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Deposit and Withdraw
            </h3>
          </header>

          {isVaultOwner ? (
            <div className="mt-4">
              <div className="bg-white rounded-md shadow dark:bg-zinc-800">
                <div className="divide-x divide-gray-200 dark:divide-gray-700 lg:grid lg:grid-cols-2 lg:gap-4">
                  <div className="flex flex-col px-4 py-5 sm:p-6">
                    <VaultDeposit
                      match={match}
                      vault={vault}
                      reserveName={reserveName}
                      decimals={['xbtc-a'].includes(vault?.collateralType?.toLowerCase()) ? decimals * 100 : decimals}
                    />
                  </div>
                  <div className="flex flex-col px-4 py-5 sm:p-6">
                    <VaultWithdraw
                      match={match}
                      maximumCollateralToWithdraw={maximumCollateralToWithdraw}
                      vault={vault}
                      reserveName={reserveName}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </Container>
  );
};
