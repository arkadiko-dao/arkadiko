import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  callReadOnlyFunction,
  cvToJSON,
  contractPrincipalCV,
  uintCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  createAssetInfo,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { TokenSwapList, tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { classNames } from '@common/class-names';
import { Placeholder } from './ui/placeholder';
import { StyledIcon } from './ui/styled-icon';

export const AddSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [balanceSelectedTokenX, setBalanceSelectedTokenX] = useState(0.0);
  const [balanceSelectedTokenY, setBalanceSelectedTokenY] = useState(0.0);
  const [tokenXAmount, setTokenXAmount] = useState(0.0);
  const [tokenYAmount, setTokenYAmount] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(0.0);
  const [pooledX, setPooledX] = useState(0.0);
  const [pooledY, setPooledY] = useState(0.0);
  const [tokenX, setTokenX] = useState(
    tokenList[
      tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdA.toLowerCase())
    ]
  );
  const [tokenY, setTokenY] = useState(
    tokenList[
      tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdB.toLowerCase())
    ]
  );
  const [tokenPair, setTokenPair] = useState('');
  const [inverseDirection, setInverseDirection] = useState(false);
  const [foundPair, setFoundPair] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [newTokens, setNewTokens] = useState(0);
  const [newShare, setNewShare] = useState(0);
  const [totalShare, setTotalShare] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const { doContractCall } = useConnect();

  const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
  const tokenXAddress = tokenTraits[tokenX['name'].toLowerCase()]['address'];
  const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
  const tokenYAddress = tokenTraits[tokenY['name'].toLowerCase()]['address'];

  const setTokenBalances = () => {
    setBalanceSelectedTokenX(
      microToReadable(state.balance[tokenX['name'].toLowerCase()], tokenX['decimals'])
    );
    setBalanceSelectedTokenY(
      microToReadable(state.balance[tokenY['name'].toLowerCase()], tokenY['decimals'])
    );
  };

  useEffect(() => {
    setTokenBalances();
  }, [state.balance]);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  const setMaximumX = () => {
    let tokenAmount = parseFloat(balanceSelectedTokenX);
    if (tokenX['name'].toLowerCase() === 'stx') {
      tokenAmount = parseFloat(balanceSelectedTokenX) - 1;
    }
    setInsufficientBalance(false);
    setTokenXAmount(tokenAmount);
    calculateTokenYAmount(Number(tokenAmount));
  };

  const setMaximumY = () => {
    let tokenAmount = parseFloat(balanceSelectedTokenY);
    if (tokenY['name'].toLowerCase() === 'stx') {
      tokenAmount = parseFloat(balanceSelectedTokenY) - 1;
    }
    setInsufficientBalance(false);
    setTokenYAmount(tokenAmount);
    calculateTokenXAmount(Number(tokenAmount));
  };

  useEffect(() => {
    const fetchPair = async (
      tokenXAddress: string,
      tokenXContract: string,
      tokenYAddress: string,
      tokenYContract: string
    ) => {
      const details = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-swap-v2-1',
        functionName: 'get-pair-details',
        functionArgs: [
          contractPrincipalCV(tokenXAddress, tokenXContract),
          contractPrincipalCV(tokenYAddress, tokenYContract),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });

      return cvToJSON(details);
    };

    const resolvePair = async () => {
      setTokenBalances();

      const json3 = await fetchPair(tokenXAddress, tokenXTrait, tokenYAddress, tokenYTrait);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        const ratio = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']);
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const basePrice = balanceY / balanceX / ratio;
        setPooledX(balanceX / Math.pow(10, tokenX['decimals']));
        setPooledY(balanceY / Math.pow(10, tokenY['decimals']));
        setInverseDirection(false);
        setTokenPair(`${tokenX.name.toLowerCase()}${tokenY.name.toLowerCase()}`);
        setCurrentPrice(basePrice);
        const totalTokens = json3['value']['value']['value']['shares-total'].value;
        setTotalTokens(totalTokens);
        const totalShare = Number(
          (
            (state.balance[`${tokenX.name.toLowerCase()}${tokenY.name.toLowerCase()}`] /
              totalTokens) *
            100
          ).toFixed(2)
        );
        if (totalShare > 100) {
          setTotalShare(100);
        } else {
          setTotalShare(totalShare);
        }
        setIsLoading(false);
        setFoundPair(true);
      } else if (Number(json3['value']['value']['value']) === 201) {
        const json4 = await fetchPair(tokenYAddress, tokenYTrait, tokenXAddress, tokenXTrait);
        if (json4['success']) {
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          setPooledX(balanceX / Math.pow(10, tokenX['decimals']));
          setPooledY(balanceY / Math.pow(10, tokenY['decimals']));
          setInverseDirection(true);
          setTokenPair(`${tokenY.name.toLowerCase()}${tokenX.name.toLowerCase()}`);
          const ratio = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']);
          const basePrice = (ratio * balanceX) / balanceY;
          setCurrentPrice(basePrice);
          const totalTokens = json4['value']['value']['value']['shares-total'].value;
          setTotalTokens(totalTokens);
          const totalShare = Number(
            (
              (state.balance[`${tokenY.name.toLowerCase()}${tokenX.name.toLowerCase()}`] /
                totalTokens) *
              100
            ).toFixed(2)
          );
          if (totalShare > 100) {
            setTotalShare(100);
          } else {
            setTotalShare(totalShare);
          }
          setFoundPair(true);
        } else {
          setFoundPair(false);
        }
        setIsLoading(false);
      }
    };

    resolvePair();
  }, [tokenX, tokenY, state.balance]);

  const onInputXChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;

    setInsufficientBalance(false);
    setTokenXAmount(value);
    calculateTokenYAmount(Number(value));

    if (value > balanceSelectedTokenX) {
      setInsufficientBalance(true);
    }
  };

  const onInputYChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;

    setInsufficientBalance(false);
    setTokenYAmount(value);
    calculateTokenXAmount(Number(value));

    if (value > balanceSelectedTokenY) {
      setInsufficientBalance(true);
    }
  };

  const clearTokenXAmount = () => {
    setTokenXAmount(0.0);
  }

  const clearTokenYAmount = () => {
    setTokenYAmount(0.0);
  }

  const calculateTokenYAmount = (value: number) => {
    setTokenYAmount(Number((currentPrice * value).toFixed(6)));
    if (currentPrice * value > balanceSelectedTokenY) {
      setInsufficientBalance(true);
    }
    const newTokens = ((totalTokens / 1000000) * value) / pooledX;
    setNewTokens(newTokens);
    if (value > 0) {
      const share = Number(((1000000 * 100 * newTokens) / totalTokens).toFixed(8));
      if (share > 100) {
        setNewShare(100);
      } else {
        setNewShare(share);
      }
    } else {
      setNewShare(0);
    }
  };

  const calculateTokenXAmount = (value: number) => {
    setTokenXAmount(value / currentPrice);
    if (value / currentPrice > balanceSelectedTokenX) {
      setInsufficientBalance(true);
    }
    const newTokens = ((totalTokens / 1000000) * value) / pooledY;
    setNewTokens(newTokens);
    if (value > 0) {
      const share = Number(((1000000 * 100 * newTokens) / totalTokens).toFixed(8));
      if (share > 100) {
        setNewShare(100);
      } else {
        setNewShare(share);
      }
    } else {
      setNewShare(0);
    }
  };

  const addLiquidity = async () => {
    let swapTrait =
      tokenTraits[`${tokenX['name'].toLowerCase()}${tokenY['name'].toLowerCase()}`]['name'];
    let tokenXParam = tokenXTrait;
    let tokenYParam = tokenYTrait;
    let tokenXName = tokenX['name'].toLowerCase();
    let tokenYName = tokenY['name'].toLowerCase();
    let tokenXInput = tokenXAmount;
    let tokenYInput = tokenYAmount;
    if (inverseDirection) {
      swapTrait =
        tokenTraits[`${tokenY['name'].toLowerCase()}${tokenX['name'].toLowerCase()}`]['name'];
      tokenXParam = tokenYTrait;
      tokenYParam = tokenXTrait;
      tokenXName = tokenY['name'].toLowerCase();
      tokenYName = tokenX['name'].toLowerCase();
      tokenXInput = tokenYAmount;
      tokenYInput = tokenXAmount;
    }
    const postConditions = [];
    if (tokenXParam == 'wrapped-stx-token') {
      postConditions.push(
        makeStandardSTXPostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(parseInt(tokenXInput * 1000000, 10)).value
        )
      );
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(parseInt(tokenXInput * 1000000, 10)).value,
          createAssetInfo(contractAddress, tokenXParam, 'wstx')
        )
      );
    } else {
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.LessEqual,
          uintCV(parseInt(tokenXInput * 1000000, 10)).value,
          createAssetInfo(contractAddress, tokenXParam, tokenXName)
        )
      );
    }
    if (tokenYParam == 'wrapped-stx-token') {
      postConditions.push(
        makeStandardSTXPostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(parseInt(tokenYInput * 1000000, 10)).value
        )
      );
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.Equal,
          uintCV(parseInt(tokenYInput * 1000000, 10)).value,
          createAssetInfo(contractAddress, tokenYParam, 'wstx')
        )
      );
    } else {
      postConditions.push(
        makeStandardFungiblePostCondition(
          stxAddress || '',
          FungibleConditionCode.LessEqual,
          uintCV(parseInt(tokenYInput * 1000000, 10)).value,
          createAssetInfo(contractAddress, tokenYParam, tokenYName)
        )
      );
    }
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v2-1',
      functionName: 'add-to-position',
      functionArgs: [
        contractPrincipalCV(tokenX['address'], tokenXParam),
        contractPrincipalCV(tokenY['address'], tokenYParam),
        contractPrincipalCV(contractAddress, swapTrait),
        uintCV(parseInt(tokenXInput * Math.pow(10, tokenX['decimals']), 10)),
        uintCV(parseInt(tokenYInput * Math.pow(10, tokenY['decimals']), 10)),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any
    }, resolveProvider() || window.StacksProvider);
  };

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
            <p className="w-full max-w-lg mb-2">
              <RouterLink to={`/pool`} exact>
                <span className="p-1.5 rounded-md inline-flex items-center">
                  <StyledIcon
                    as="ArrowLeftIcon"
                    size={4}
                    className="mr-2 text-gray-500 group-hover:text-gray-900"
                  />
                  <span className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100">
                    Back to pool overview
                  </span>
                </span>
              </RouterLink>
            </p>
            <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow dark:bg-zinc-800">
              <div className="flex flex-col p-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <h2 className="text-xl leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Liquidity
                    </h2>
                    <p className="inline-flex items-center mt-1 text-sm text-gray-600 dark:text-zinc-400">
                      Add liquidity to receive LP tokens
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`Providing liquidity through a pair of assets is a great way to earn passive income from your idle crypto tokens.`}
                      >
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={5}
                          className="block ml-2 text-gray-400"
                        />
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-300 dark:hover:bg-zinc-200">
                  <button
                    type="button"
                    className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5"
                  >
                    <StyledIcon as="PlusCircleIcon" size={4} className="mr-2 text-indigo-500" />
                    <span className="text-gray-900">Add</span>
                  </button>

                  <RouterLink
                    className="ml-0.5 flex items-center justify-center flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100"
                    to={`/swap/remove/${match.params.currencyIdA}/${match.params.currencyIdB}`}
                    exact
                  >
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <StyledIcon
                        as="MinusCircleIcon"
                        size={4}
                        className="mr-2 text-gray-500 dark:text-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-900"
                      />
                      <span className="text-gray-600 dark:text-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-800">
                        Remove
                      </span>
                    </span>
                  </RouterLink>
                </div>

                <form className="mt-4">
                  {isLoading ? (
                    <>
                      <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200 h-[104px]">
                        <div className="flex items-center p-4 pb-2">
                          <TokenSwapList selected={tokenX} disabled={true} />
                        </div>

                        <div className="flex items-center justify-end p-4 pt-0">
                          <Placeholder
                            className="justify-start py-2"
                            width={Placeholder.width.THIRD}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-center my-3">
                        <StyledIcon
                          as="PlusIcon"
                          size={6}
                          solid={false}
                          className="text-gray-500"
                        />
                      </div>

                      <div className="mt-1 border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200 h-[104px]">
                        <div className="flex items-center p-4 pb-2">
                          <TokenSwapList selected={tokenY} disabled={true} />
                        </div>

                        <div className="flex items-center justify-end p-4 pt-0">
                          <Placeholder
                            className="justify-start py-2"
                            width={Placeholder.width.THIRD}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
                        <div className="flex flex-col p-4 pb-2 sm:flex-row sm:items-center">
                          <TokenSwapList
                            selected={tokenX}
                            setSelected={setTokenX}
                            disabled={true}
                          />

                          <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <label htmlFor="tokenXAmount" className="sr-only">
                              {tokenX.name}
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              autoFocus={true}
                              autoComplete="off"
                              autoCorrect="off"
                              name="tokenXAmount"
                              id="tokenXAmount"
                              pattern="^[0-9]*[.,]?[0-9]*$"
                              placeholder="0.0"
                              value={tokenXAmount || ''}
                              onChange={onInputXChange}
                              min={0}
                              className="flex-1 p-0 m-0 text-xl font-semibold truncate border-0 sm:text-right focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
                              style={{ appearance: 'textfield' }}
                            />

                            <button
                              type="button"
                              onClick={clearTokenXAmount}
                              className="relative z-10 flex items-center justify-center w-6 h-6 text-gray-400 transform bg-white border border-gray-300 rounded-md sm:hidden dark:bg-zinc-800 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:hover:text-indigo-400"
                            >
                              <StyledIcon as="XIcon" size={3} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end p-4 pt-0 text-xs sm:text-sm">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center justify-start">
                              <p className="text-gray-500 dark:text-gray-50">
                                Balance:{' '}
                                {balanceSelectedTokenX.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                {tokenX.name}
                              </p>
                              {parseInt(balanceSelectedTokenX, 10) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setMaximumX()}
                                  className="p-1 ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                                >
                                  Max.
                                </button>
                              ) : (
                                ``
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center my-3">
                        <StyledIcon
                          as="PlusIcon"
                          size={6}
                          solid={false}
                          className="text-gray-500"
                        />
                      </div>

                      <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
                        <div className="flex flex-col p-4 pb-2 sm:flex-row sm:items-center">
                          <TokenSwapList
                            selected={tokenY}
                            setSelected={setTokenY}
                            disabled={true}
                          />

                          <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <label htmlFor="tokenYAmount" className="sr-only">
                              {tokenY.name}
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              autoFocus={true}
                              autoComplete="off"
                              autoCorrect="off"
                              name="tokenYAmount"
                              id="tokenYAmount"
                              pattern="^[0-9]*[.,]?[0-9]*$"
                              placeholder="0.0"
                              value={tokenYAmount || ''}
                              onChange={onInputYChange}
                              min={0}
                              className="flex-1 p-0 m-0 text-xl font-semibold truncate border-0 sm:text-right focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
                              style={{ appearance: 'textfield' }}
                            />

                            <button
                              type="button"
                              onClick={clearTokenYAmount}
                              className="relative z-10 flex items-center justify-center w-6 h-6 text-gray-400 transform bg-white border border-gray-300 rounded-md sm:hidden dark:bg-zinc-800 hover:text-indigo-700 focus:outline-none focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:hover:text-indigo-400"
                            >
                              <StyledIcon as="XIcon" size={3} />
                            </button>
                          </div>

                        </div>

                        <div className="flex items-center justify-end p-4 pt-0 text-xs sm:text-sm">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center justify-start">
                              <p className="text-gray-500 dark:text-gray-50">
                                Balance:{' '}
                                {balanceSelectedTokenY.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                {tokenY.name}
                              </p>
                              {parseInt(balanceSelectedTokenY, 10) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setMaximumY()}
                                  className="p-1 ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                                >
                                  Max.
                                </button>
                              ) : (
                                ``
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                    <h4 className="text-xs text-indigo-700 uppercase font-headings">
                      Prices and pool share
                    </h4>
                    <dl className="mt-2 space-y-1">
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Your pool tokens
                          <div className="ml-2">
                            <Tooltip
                              className="z-10"
                              shouldWrapChildren={true}
                              label={`Indicates the total amount of LP tokens you own of the pair in this pool`}
                            >
                              <StyledIcon
                                as="InformationCircleIcon"
                                size={4}
                                className="block text-indigo-400 dark:text-indigo-500"
                              />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="justify-end" width={Placeholder.width.HALF} />
                          ) : (
                            <>
                              {state.balance[tokenPair] > 0
                                ? `${
                                    state.balance[tokenPair] / 1000000 + newTokens
                                  } (${newTokens} new)`
                                : newTokens}
                            </>
                          )}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Your pool share
                          <div className="ml-2">
                            <Tooltip
                              className="z-10"
                              shouldWrapChildren={true}
                              label={`The percentual share of LP tokens you own against the whole pool supply`}
                            >
                              <StyledIcon
                                as="InformationCircleIcon"
                                size={4}
                                className="block text-indigo-400 dark:text-indigo-500"
                              />
                            </Tooltip>
                          </div>
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="justify-end" width={Placeholder.width.FULL} />
                          ) : (
                            <>
                              {state.balance[tokenPair] > 0
                                ? `${(totalShare + newShare).toFixed(2)}% (${newShare.toFixed(
                                    2
                                  )}% new)`
                                : `${newShare}%`}
                            </>
                          )}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Pooled {tokenX.name}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="justify-end" width={Placeholder.width.THIRD} />
                          ) : (
                            <>
                              {pooledX.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}
                            </>
                          )}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                          Pooled {tokenY.name}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                          {isLoading ? (
                            <Placeholder className="justify-end" width={Placeholder.width.THIRD} />
                          ) : (
                            <>
                              {pooledY.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}
                            </>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    type="button"
                    disabled={insufficientBalance || tokenYAmount === 0 || !foundPair}
                    onClick={() => addLiquidity()}
                    className={classNames(
                      tokenYAmount === 0 || !foundPair
                        ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                      'w-full mt-4 inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-sm sm:text-xl rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    )}
                  >
                    {isLoading
                      ? 'Loading...'
                      : !foundPair
                      ? 'No liquidity for this pair. Try another one.'
                      : tokenYAmount === 0
                      ? 'Please enter an amount'
                      : insufficientBalance
                      ? 'Insufficient balance'
                      : 'Confirm adding liquidity'}
                  </button>

                  <div className="flex items-start flex-1 mt-8">
                    <span className="flex p-2 bg-gray-100 rounded-lg">
                      <StyledIcon
                        as="CashIcon"
                        size={6}
                        solid={false}
                        className="text-indigo-500"
                      />
                    </span>
                    <p className="ml-4 text-sm text-gray-500 dark:text-zinc-400">
                      By adding liquidity, you will earn 0.25% on trades for this pool, proportional
                      to your share of liquidity. Earned fees are added back to the pool and
                      claimable by removing liquidity.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
