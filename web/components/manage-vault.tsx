import React, { useContext, useEffect, useState, useMemo, Fragment } from 'react';
import { Tooltip } from '@blockstack/ui';
import { Container } from './home';
import { VaultDeposit } from '@components/vault-deposit';
import { VaultWithdraw } from '@components/vault-withdraw';
import { VaultMint } from '@components/vault-mint';
import { VaultBurn } from '@components/vault-burn';
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
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo
} from '@stacks/transactions';
import { AppContext, CollateralTypeProps } from '@common/context';
import { debtClass, VaultProps } from './collateral-card';
import { getPrice } from '@common/get-price';
import { getLiquidationPrice, tokenTraits, tokenNameToTicker } from '@common/vault-utils';
import { Redirect } from 'react-router-dom';
import { getRPCClient } from '@common/utils';
import { microToReadable, availableCollateralToWithdraw, getCollateralToDebtRatio } from '@common/vault-utils';
import { addMinutes } from 'date-fns';
import { Placeholder } from './ui/placeholder';
import { Alert } from './ui/alert';
import { PoxTimeline } from '@components/pox-timeline';
import { StyledIcon } from './ui/styled-icon';
import { Status } from './ui/health-status';
import { collExtraInfo } from './collateral-card';
import { useConnect } from '@stacks/connect-react';
import { Popover, Transition } from '@headlessui/react';

export const ManageVault = ({ match }) => {
  const senderAddress = useSTXAddress();
  const [state, setState] = useContext(AppContext);
  const [{ collateralTypes }, _x] = useContext(AppContext);
  const { doContractCall } = useConnect();

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
  const [liquidityAvailable, setLiquidityAvailable] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);

  const [loadingVaultData, setLoadingVaultData] = useState(true);
  const [loadingFeesData, setLoadingFeesData] = useState(true);
  const [showBurnWarning, setShowBurnWarning] = useState(false);
  const [showLiquidityWarning, setShowLiquidityWarning] = useState(false);
  const [showMinimumFeeWarning, setShowMinimumFeeWarning] = useState(false);

  const minimimumStabilityFee = useMemo(
    () => {
      // If stability fee is 0 (i.e. no blocks have passed), we need to make sure a minimum is calculated
      // e.g. ~3 blocks of stability fees worth
      // (/ (* (/ (* (get stability-fee collateral-info) (get debt vault)) u10000) vault-blocks) (* u144 u365))
      const yearlyFee = 1200; // 4% in bps
      const numBlocks = 12;
      const minFee = 1000000 * totalDebt * yearlyFee * numBlocks / (10000 * 144 * 365);
      console.log('Minimum fee', minFee);
      return Math.max(stabilityFee, minFee.toFixed(1));
    },
    [stabilityFee]
  );

  const getTotalDebt = async () => {
    const collateralType = collateralTypes[collateralSymbol];
    const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];

    const debtCall = await callReadOnlyFunction({
      contractAddress,
      contractName: 'arkadiko-vaults-data-v1-1',
      functionName: 'get-total-debt',
      functionArgs: [contractPrincipalCV(tokenInfo['address'], tokenInfo['name'])],
      senderAddress: senderAddress || contractAddress,
      network: network,
    });
    const totalDebt = Number(debtCall.value.value);

    setLiquidityAvailable(Number(collateralType['maximumDebt']) - totalDebt);
  };

  useEffect(() => {
    if (vault && collateralTypes[collateralSymbol]) {
      // (liquidationRatio * coinsMinted) / collateral = rekt
      const prc = Number(getLiquidationPrice(
        collateralTypes[collateralSymbol]?.liquidationRatio / 100.0,
        vault['debt'],
        vault['collateral'],
        vault['collateralToken']
      )).toFixed(2);
      setLiquidationPrice(prc);
    }
  }, [vault, collateralTypes])

  useEffect(() => {
    const fetchVault = async () => {
      const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];
      const serializedVault = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vaults-data-v1-1',
        functionName: 'get-vault',
        functionArgs: [
          standardPrincipalCV(vaultOwner),
          contractPrincipalCV(tokenInfo['address'], tokenInfo['name'])
        ],
        senderAddress: senderAddress || contractAddress,
        network: network,
      });
      const data = cvToJSON(serializedVault).value.value;

      if (data['status'] !== 0) {
        const positionUrl = `https://arkadiko-vaults-api-029bd7781bb7.herokuapp.com/api/position?address=${senderAddress}&token=${tokenInfo['address']}.${tokenInfo['name']}`;
        const positionResponse = await fetch(positionUrl, { credentials: 'omit' });
        const positionData = await positionResponse.json();

        setVault({
          owner: vaultOwner,
          collateral: data['collateral'].value,
          collateralToken: collateralSymbol,
          collateralType: collateralSymbol,
          isLiquidated: false,
          debt: data['debt'].value,
          status: data['status'].value,
          position: positionData.position
        });
        setIsVaultOwner(vaultOwner === senderAddress);

        const price = await getPrice(collateralSymbol);
        setPrice(price);
        setLoadingVaultData(false);
      }
    };
    fetchVault();
  }, [match.params.owner, match.params.collateral]);

  useEffect(() => {
    if (Object.keys(collateralTypes).length < 3) return;

    setCollateralType(collateralTypes[collateralSymbol]);
    getTotalDebt();
  }, [collateralTypes, collateralSymbol, state.vaults]);

  useEffect(() => {
    if (vault?.status && collateralTypes[collateralSymbol]?.collateralToDebtRatio && price > 0) {
      setMaximumCollateralToWithdraw(
        availableCollateralToWithdraw(
          price * 100,
          collateralLocked(),
          outstandingDebt(),
          collateralTypes[collateralSymbol]?.collateralToDebtRatio,
          vault?.collateralToken
        )
      );
    }
  }, [collateralTypes, price, vault?.status]);

  useEffect(() => {
    const fetchFees = async () => {
      const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];
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
          contractPrincipalCV(tokenInfo['address'], tokenInfo['name'])
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
      const decimals = ['stx', 'ststx'].includes(collateralSymbol.toLowerCase()) ? 1000000 : 100000000;
      setDecimals(decimals);
      fetchFees();

      const ratio = getCollateralToDebtRatio(
        price / decimals,
        vault['debt'],
        vault['collateral']
      ) * 100.0;
      setDebtRatio(ratio);
    }
  }, [vault, price]);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  const closeVault = async () => {
    const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];
    const totalToBurn = Number(totalDebt * 1.1) * 1000000;
    const postConditions = [
      makeStandardFungiblePostCondition(
        senderAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(parseInt(totalToBurn, 10)).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    const tokenAddress = tokenInfo['address'];
    const token = tokenInfo['name'];

    const args = [
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-tokens-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-data-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-sorted-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-pool-active-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-helpers-v1-1'
      ),
      contractPrincipalCV(tokenAddress, token)
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-vaults-operations-v1-2',
      functionName: 'close-vault',
      functionArgs: args,
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished burn!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
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
        data: debtRatio.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        unit: '%'
      },
      {
        label: 'Collateral amount',
        help: 'The amount of collateral you deposited in this vault',
        data: collateralLocked(),
        unit: tokenNameToTicker(vault?.collateralToken || '')
      },
      {
        label: 'Outstanding debt',
        help: `Your total debt including a ${collateralTypes[collateralSymbol]?.stabilityFeeApy / 100}% yearly stability fee.`,
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
        data: collateralTypes[collateralSymbol]?.liquidationRatio / 100.0,
        unit: '%'
      },
      {
        label: 'Liquidation penalty',
        help: 'The penalty you pay when your vault gets liquidated',
        data: collateralTypes[collateralSymbol]?.liquidationPenalty,
        unit: '%'
      },
      {
        label: 'Stability fee',
        help: 'Yearly interest you pay on your USDA loan',
        data: collateralTypes[collateralSymbol]?.stabilityFee / 100.0,
        unit: '%'
      }
    ]
  };

  return (
    <Container>

      <main className="flex-1 py-12">
        <section>
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <div className="flex items-center justify-between">
              <div>
                {loadingVaultData ? (
                  <Placeholder className="py-2 w-[150px]" color={Placeholder.color.GRAY} />
                ) : (
                  <div className="flex items-end gap-x-4">
                    <div className={`flex items-center justify-center w-16 h-16 shrink-0 bg-white/60 dark:bg-white/10 rounded-md border border-gray-400/30`}>
                      <img className="w-10 h-10" src={collExtraInfo[collateralSymbol]['logo']} alt="" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="mb-2 text-xl font-bold leading-6 text-gray-900 font-headings dark:text-zinc-50">
                        {collateralSymbol}
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
                            {debtClass(collateralTypes[collateralSymbol]?.liquidationRatio / 100.0, debtRatio) == 'text-green-500' ? (
                              <Status
                                type={Status.type.SUCCESS }
                                label='Healthy'
                                labelHover='Low liquidation risk'
                              />
                            ) : debtClass(collateralTypes[collateralSymbol]?.liquidationRatio / 100.0, debtRatio) == 'text-orange-500' ? (
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
                    <div className="flex items-end gap-2">
                      <Popover className="relative">
                        {() => (
                          <>
                            <Popover.Button
                              className={`border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${collExtraInfo[collateralSymbol]['classes']['wrapper']} ${vault?.position <= 3 ? 'bg-red-600' : collExtraInfo[collateralSymbol]['classes']['innerBg']} cursor-help`}
                              id="open-redemption-info"
                            >
                              <div className={`flex items-center justify-center px-2.5 py-1 text-base shrink-0 rounded-md text-white font-semibold`}>
                                #{vault?.position}
                              </div>
                            </Popover.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="opacity-0 translate-y-1"
                              enterTo="opacity-100 translate-y-0"
                              leave="transition ease-in duration-150"
                              leaveFrom="opacity-100 translate-y-0"
                              leaveTo="opacity-0 translate-y-1"
                            >
                              <Popover.Panel className="absolute left-0 z-20 w-screen max-w-sm px-4 mt-3 sm:px-0">
                                <div className="overflow-hidden border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:border-zinc-700">
                                  <div className="relative p-4 bg-white dark:bg-zinc-800">
                                    <p className="text-sm font-normal">Your ranking on the Arkadiko Vaults list determines the risk level of your vault being triggered by redemptions, with lower ranking indicating higher risk.</p>
                                    <ul className="pl-4 mt-2 text-sm font-normal list-disc">
                                      <li>
                                        <a
                                          className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                                          href="https://docs.arkadiko.finance/protocol/redemptions"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          Learn more about redemptions
                                          <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
                                        </a>
                                      </li>
                                      <li>
                                        <a
                                          className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                                          href="https://arkadiko-vaults-api-029bd7781bb7.herokuapp.com/"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          Check out the Vaults list
                                          <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
                                        </a>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </Popover.Panel>
                            </Transition>
                          </>
                        )}
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
              {vaultOwner === senderAddress && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => closeVault()}
                  >
                    Close Vault
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="mt-4">
            <Alert type={Alert.type.WARNING} title="Important note">
              <p>
                Since you have an active Arkadiko vault, you confirm that you understand the risks of a DeFi platform, including{' '}
                <span className="font-semibold">
                  smart contract, liquidation and redemption risks
                </span>
                .
              </p>

              <p className="mt-1">
                <a
                  href="https://docs.arkadiko.finance/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  Learn more about Arkadiko.
                </a>
              </p>
            </Alert>
          </div>

          <div className="mt-4" id="liquidation-status-alert">
            <div className={`flex flex-col rounded-md bg-white dark:bg-zinc-800 shadow`}>
              <h3 className="text-base font-normal leading-6 text-gray-900 sr-only font-headings dark:text-zinc-50">
                Vault details
              </h3>
              {/*@TODO: convert vault*/}
              {vault?.collateralToken?.toLowerCase() === 'stx' && false && (
                <Alert type={Alert.type.INFO} title="Want to earn more yield?">
                  <p>
                    Convert your vault into a stSTX vault and automatically earn yield from the Stacks blockchain. <a href="https://docs.stackingdao.com" target="_blank" className="underline">Read more about liquid stacking.</a>
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 mt-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => callMint()}
                  >
                    Convert vault to stSTX
                  </button>
                </Alert>
              )}
              <div className="flex flex-col h-full p-4">
                <div className="space-y-2 lg:grid md:items-center lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  <div className={`flex flex-col items-center h-full px-4 py-5 mb-4 border rounded-lg sm:mb-0 ${collExtraInfo[collateralSymbol]['classes']['innerBg']} ${collExtraInfo[collateralSymbol]['classes']['wrapper']} bg-opacity-10`}>
                    <dl className="flex-1 w-full space-y-2">
                      {vaultDetails.primary.map(detail => (
                        <div className="sm:grid sm:grid-flow-col sm:gap-4 sm:auto-cols-auto" key={detail.label}>
                        <dt className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400">
                          <p className={`text-sm font-semibold ${collExtraInfo[collateralSymbol]['classes']['innerText']}`}>
                            {detail.label}
                          </p>
                            <Tooltip
                              shouldWrapChildren={true}
                              label={detail.help}
                            >
                              <StyledIcon
                                as="InformationCircleIcon"
                                size={4}
                                className={`block ml-2 ${collExtraInfo[collateralSymbol]['classes']['innerText']} dark:brightness-100 dark:text-gray-400`}
                              />
                            </Tooltip>
                          </dt>
                          <dd className="mt-1 text-sm text-right sm:mt-0">
                            {loadingVaultData ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.GRAY}
                                width={Placeholder.width.FULL}
                              />
                            ) : (
                              <p
                                className="text-base font-semibold leading-none"
                              >
                                {detail.label === 'Collateral to Debt ratio' ? (
                                  <>
                                    <span className="flex items-center justify-end">
                                      {debtClass(collateralTypes[collateralSymbol]?.liquidationRatio / 100.0, debtRatio) == 'text-green-500' ? (
                                        <Status
                                          type={Status.type.SUCCESS}
                                        />
                                      ) : debtClass(collateralTypes[collateralSymbol]?.liquidationRatio / 100.0, debtRatio) == 'text-orange-500' ? (
                                        <Status
                                          type={Status.type.WARNING}
                                        />
                                      ) : (
                                        <Status
                                          type={Status.type.ERROR}
                                        />
                                      )}
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
                                    collateralTypes[collateralSymbol]?.liquidationRatio / 100.0,
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
                        {debtClass(collateralTypes[collateralSymbol]?.liquidationRatio / 100.0, debtRatio) ==
                        'text-green-500' ? (
                          <Alert type={Alert.type.SUCCESS} title="Low liquidation risk">
                            <p>
                              Good job! Your vault looks quite healthy. Your liquidation price
                              ({vault?.collateralToken} below{' '}
                              <span className="font-semibold">${liquidationPrice}</span>) is
                              still very far.
                            </p>
                            <p>Feel free to pay back your debt or deposit extra collateral anytime.</p>
                          </Alert>
                        ) : debtClass(collateralTypes[collateralSymbol]?.liquidationRatio / 100.0, debtRatio) ==
                          'text-orange-500' ? (
                          <Alert type={Alert.type.WARNING} title="Medium liquidation risk">
                            <p>
                              Be careful. You will be liquidated if the{' '}
                              {vault?.collateralToken} price drops below{' '}
                              <span className="font-semibold">${liquidationPrice} USD</span>.
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
                              <span className="font-semibold">${liquidationPrice} USD</span>.
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
                      <p className="mt-2.5 text-xl font-semibold text-gray-900">
                        ${price / (['xbtc'].includes(vault?.collateralType?.toLowerCase()) ? decimals / 100 : decimals)}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-200 dark:bg-gray-300 rounded-3xl">
                      <img src={collExtraInfo[collateralSymbol]['logo']} className="w-14" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {vaultOwner === senderAddress && (
              <div className="mt-4">
                <div className="bg-white rounded-md shadow dark:bg-zinc-800">
                  <div className="divide-x divide-gray-200 dark:divide-gray-700 lg:grid lg:grid-cols-2 lg:gap-4">
                    <div className="flex flex-col px-4 py-5 sm:p-6">
                      <VaultMint
                        match={match}
                        vault={vault}
                        reserveName={reserveName}
                        price={price}
                        collateralType={collateralTypes[collateralSymbol]}
                        stabilityFee={minimimumStabilityFee}
                        liquidityAvailable={liquidityAvailable}
                        setShowLiquidityWarning={setShowLiquidityWarning}
                        setShowBurnWarning={setShowBurnWarning}
                      />
                      {showBurnWarning && (
                        <span className="mt-2 text-orange-500">A vault needs at least 500 USDA. Please make sure the vault has at least 500 USDA.</span>
                      )}
                      {showLiquidityWarning && (
                        <span className="mt-2 text-orange-500">The amount of USDA you want to mint exceeds the amount of liquidity available in the system ({(liquidityAvailable / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA). Please mint a lower amount of USDA.</span>
                      )}
                    </div>
                    <div className="flex flex-col px-4 py-5 sm:p-6">
                      <VaultBurn
                        outstandingDebt={outstandingDebt}
                        stabilityFee={minimimumStabilityFee}
                        match={match}
                        vault={vault}
                        reserveName={reserveName}
                        setShowBurnWarning={setShowBurnWarning}
                        setShowMinimumFeeWarning={setShowMinimumFeeWarning}
                      />
                      {showBurnWarning && (
                        <span className="mt-2 text-orange-500">A vault needs at least 500 USDA. If you want to close your vault, use the "Close Vault" button at the top of this page.</span>
                      )}
                      {showMinimumFeeWarning && (
                        <span className="mt-2 text-orange-500">You need at least {(minimimumStabilityFee / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA in your wallet to burn debt.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {vaultOwner === senderAddress && (
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
                        decimals={decimals}
                        stabilityFee={minimimumStabilityFee}
                        setShowBurnWarning={setShowBurnWarning}
                      />
                      {showBurnWarning && (
                        <span className="mt-2 text-orange-500">A vault needs at least 500 USDA. Please mint additional USDA first.</span>
                      )}
                    </div>
                    <div className="flex flex-col px-4 py-5 sm:p-6">
                      <VaultWithdraw
                        match={match}
                        maximumCollateralToWithdraw={maximumCollateralToWithdraw}
                        vault={vault}
                        reserveName={reserveName}
                        stabilityFee={minimimumStabilityFee}
                        setShowBurnWarning={setShowBurnWarning}
                      />
                      {showBurnWarning && (
                        <span className="mt-2 text-orange-500">A vault needs at least 500 USDA. Please mint additional USDA first.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </Container>
  );
};
