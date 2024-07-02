import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import {
  AnchorMode,
  callReadOnlyFunction,
  cvToJSON,
  contractPrincipalCV,
  uintCV,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo,
  makeContractFungiblePostCondition,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { tokenTraits } from '@common/vault-utils';
import { tokenList } from '@components/token-swap-list';
import { Tooltip } from '@blockstack/ui';
import { NavLink as RouterLink } from 'react-router-dom';
import { microToReadable } from '@common/vault-utils';
import { classNames } from '@common/class-names';
import BN from 'bn.js';
import { Placeholder } from './ui/placeholder';
import { StyledIcon } from './ui/styled-icon';

export const RemoveSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const [tokenXPrice, setTokenXPrice] = useState(0.0);
  const [tokenYPrice, setTokenYPrice] = useState(0.0);
  const [tokenXToReceive, setTokenXToReceive] = useState(0.0);
  const [tokenYToReceive, setTokenYToReceive] = useState(0.0);
  const [tokenX] = useState(
    tokenList[
      tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdA.toLowerCase())
    ]
  );
  const [tokenY] = useState(
    tokenList[
      tokenList.findIndex(v => v['name'].toLowerCase() === match.params.currencyIdB.toLowerCase())
    ]
  );
  const [inverseDirection, setInverseDirection] = useState(false);
  const [foundPair, setFoundPair] = useState(false);
  const [balance, setBalance] = useState(0.0);
  const [percentageToRemove, setPercentageToRemove] = useState(100);
  const [balanceX, setBalanceX] = useState(0.0);
  const [balanceY, setBalanceY] = useState(0.0);
  const [isLoading, setIsLoading] = useState(true);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const { doContractCall } = useConnect();

  const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
  const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

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
      const json3 = await fetchPair(tokenX['address'], tokenXTrait, tokenY['address'], tokenYTrait);
      console.log('Pair Details:', json3);
      if (json3['success']) {
        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;
        const ratio = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']);
        const basePrice = (ratio * balanceX) / balanceY;
        const totalShares = json3['value']['value']['value']['shares-total'].value;
        const balance =
          state.balance[`${tokenX.nameInPair.toLowerCase()}${tokenY.nameInPair.toLowerCase()}`];
        const poolPercentage = balance / totalShares;
        if (balance !== undefined) {
          setFoundPair(true);
          setTokenXPrice(basePrice);
          setTokenYPrice(balanceY / balanceX / ratio);
          setInverseDirection(false);
          setBalance(balance);
          setBalanceX(balanceX * poolPercentage);
          setBalanceY(balanceY * poolPercentage);
          setTokenXToReceive((balanceX * poolPercentage * percentageToRemove) / 100);
          setTokenYToReceive((balanceY * poolPercentage * percentageToRemove) / 100);
          setIsLoading(false);
        }
      } else if (Number(json3['value']['value']['value']) === 201) {
        const json4 = await fetchPair(
          tokenY['address'],
          tokenYTrait,
          tokenX['address'],
          tokenXTrait
        );
        if (json4['success']) {
          console.log(json4);
          const balanceX = json4['value']['value']['value']['balance-x'].value;
          const balanceY = json4['value']['value']['value']['balance-y'].value;
          const ratio = Math.pow(10, tokenY['decimals']) / Math.pow(10, tokenX['decimals']);
          const basePrice = (balanceX / balanceY).toFixed(2);
          const totalShares = json4['value']['value']['value']['shares-total'].value;
          const balance =
            state.balance[`${tokenX.nameInPair.toLowerCase()}${tokenY.nameInPair.toLowerCase()}`];
          const poolPercentage = balance / totalShares;
          if (balance !== undefined) {
            setFoundPair(true);
            setTokenXPrice(basePrice);
            setTokenYPrice(balanceY / balanceX / ratio);
            setInverseDirection(true);
            setBalance(balance);
            setBalanceX(balanceX * poolPercentage);
            setBalanceY(balanceY * poolPercentage);
            setTokenXToReceive((balanceX * poolPercentage * percentageToRemove) / 100);
            setTokenYToReceive((balanceY * poolPercentage * percentageToRemove) / 100);
            setIsLoading(false);
          }
        }
      }
    };

    if (tokenX && tokenY && state.balance) {
      resolvePair();
    }
  }, [tokenX, tokenY, state.balance]);

  const onInputChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;

    removePercentage(value);
  };

  const removePercentage = (percentage: number) => {
    setPercentageToRemove(percentage);
    setTokenXToReceive((balanceX * percentage) / 100);
    setTokenYToReceive((balanceY * percentage) / 100);
  };

  const removeLiquidity = async () => {
    const pairName = `${tokenX['name'].toLowerCase()}${tokenY['name'].toLowerCase()}`;
    let swapTrait = tokenTraits[pairName]['name'];
    let tokenXParam = tokenXTrait;
    let tokenYParam = tokenYTrait;
    let tokenXName = tokenX['nameInPair'].toLowerCase();
    let tokenYName = tokenY['nameInPair'].toLowerCase();
    if (inverseDirection) {
      swapTrait = tokenTraits[pairName]['name'];
      tokenXParam = tokenYTrait;
      tokenYParam = tokenXTrait;
      tokenXName = tokenY['nameInPair'].toLowerCase();
      tokenYName = tokenX['nameInPair'].toLowerCase();
    }

    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(parseInt((balance / 100) * (percentageToRemove + 5), 10)).value,
        createAssetInfo(contractAddress, swapTrait, tokenTraits[pairName]['swap'].toLowerCase())
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v2-1',
        FungibleConditionCode.LessEqual,
        new BN(tokenXToReceive, 10),
        createAssetInfo(contractAddress, tokenXParam, tokenXName)
      ),
      makeContractFungiblePostCondition(
        contractAddress,
        'arkadiko-swap-v2-1',
        FungibleConditionCode.LessEqual,
        new BN(tokenYToReceive, 10),
        createAssetInfo(contractAddress, tokenYParam, tokenYName)
      ),
    ];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-swap-v2-1',
      functionName: 'reduce-position',
      functionArgs: [
        contractPrincipalCV(tokenX['address'], tokenXParam),
        contractPrincipalCV(tokenY['address'], tokenYParam),
        contractPrincipalCV(contractAddress, swapTrait),
        uintCV(percentageToRemove),
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

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
            <p className="w-full max-w-lg mb-2">
              <RouterLink className="" to={`/pool`} exact>
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
                    <h2 className="text-xl font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Liquidity
                    </h2>
                    <p className="inline-flex items-center mt-1 text-sm text-gray-600 dark:text-zinc-400">
                      Remove liquidity to burn LP tokens and take out your rewards
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`By removing liquidity, you take out assets you provided and will stop earning on each trade.`}
                      >
                        <StyledIcon
                          as="InformationCircleIcon"
                          size={5}
                          className="block mr-2 text-gray-400"
                        />
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-300 dark:hover:bg-zinc-200">
                  <RouterLink
                    className="flex items-center justify-center flex-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100"
                    to={`/swap/add/${match.params.currencyIdA}/${match.params.currencyIdB}`}
                    exact
                  >
                    <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                      <StyledIcon
                        as="PlusCircleIcon"
                        size={4}
                        className="mr-2 text-gray-500 dark:text-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-900"
                      />
                      <span className="text-gray-600 dark:text-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-800">
                        Add
                      </span>
                    </span>
                  </RouterLink>

                  <button
                    type="button"
                    className="ml-0.5 p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5"
                  >
                    <StyledIcon as="MinusCircleIcon" size={4} className="mr-2 text-indigo-500" />
                    <span className="text-gray-900">Remove</span>
                  </button>
                </div>

                <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                  <h4 className="text-xs font-normal text-indigo-700 uppercase font-headings">
                    Your position
                  </h4>
                  <dl className="mt-2 space-y-1">
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="inline-flex items-center text-base font-medium text-indigo-500">
                        <div className="flex mr-2 -space-x-2">
                          <img
                            className="inline-block w-6 h-6 rounded-full ring-2 ring-white"
                            src={tokenX.logo}
                            alt=""
                          />
                          <img
                            className="inline-block w-6 h-6 rounded-full ring-2 ring-white"
                            src={tokenY.logo}
                            alt=""
                          />
                        </div>
                        {tokenX.name}/{tokenY.name}
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                        {isLoading ? (
                          <Placeholder className="justify-end" width={Placeholder.width.FULL} />
                        ) : (
                          <>{microToReadable(balance)}</>
                        )}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                        {tokenX.name}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                        {isLoading ? (
                          <Placeholder className="justify-end" width={Placeholder.width.HALF} />
                        ) : (
                          <>{microToReadable(balanceX, tokenX['decimals'])}</>
                        )}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                        {tokenY.name}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                        {isLoading ? (
                          <Placeholder className="justify-end" width={Placeholder.width.HALF} />
                        ) : (
                          <>{microToReadable(balanceY, tokenY['decimals'])}</>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <form className="mt-4">
                  <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
                    <div className="flex items-center p-4">
                      <div className="lg:flex lg:items-start lg:flex-1 lg:justify-between">
                        <label
                          htmlFor="removeLiquidityAmount"
                          className="block mr-4 text-base text-gray-700 dark:text-zinc-200 shrink-0"
                        >
                          Amount to remove
                        </label>
                        <div className="flex flex-col">
                          <div className="relative rounded-md">
                            <input
                              type="number"
                              inputMode="decimal"
                              autoFocus={true}
                              autoComplete="off"
                              autoCorrect="off"
                              name="removeLiquidityAmount"
                              id="removeLiquidityAmount"
                              pattern="^[0-9]*[.,]?[0-9]*$"
                              placeholder="0.0"
                              value={percentageToRemove}
                              onChange={onInputChange}
                              className="block p-0 pr-4 m-0 text-3xl font-semibold text-right text-gray-700 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-200 w-52"
                              style={{ appearance: 'textfield' }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-end pb-1 pointer-events-none">
                              %
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => {
                                removePercentage(25);
                              }}
                            >
                              25%
                            </button>
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => {
                                removePercentage(50);
                              }}
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => {
                                removePercentage(75);
                              }}
                            >
                              75%
                            </button>
                            <button
                              type="button"
                              className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                              onClick={() => {
                                removePercentage(100);
                              }}
                            >
                              Max.
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center my-3">
                    <StyledIcon as="ArrowDownIcon" size={6} className="text-gray-500" />
                  </div>

                  <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
                    <div className="p-4">
                      <p className="text-base text-gray-700 dark:text-zinc-200">You will receive</p>

                      <dl className="mt-4 space-y-2">
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 shrink-0">
                                <img className="w-8 h-8 rounded-full" src={tokenX.logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900 dark:text-zinc-50">
                                  {tokenX.name}
                                </div>
                              </div>
                            </div>
                          </dt>
                          <dd className="mt-1 text-lg font-semibold text-gray-700 sm:mt-0 sm:justify-end sm:inline-flex dark:text-zinc-200">
                            {isLoading ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.GRAY}
                                width={Placeholder.width.HALF}
                              />
                            ) : (
                              <>{microToReadable(tokenXToReceive, tokenX['decimals'])}</>
                            )}
                          </dd>
                        </div>
                        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                          <dt className="text-lg font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 shrink-0">
                                <img className="w-8 h-8 rounded-full" src={tokenY.logo} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base text-gray-900 dark:text-zinc-50">
                                  {tokenY.name}
                                </div>
                              </div>
                            </div>
                          </dt>
                          <dd className="mt-1 text-lg font-semibold text-gray-700 sm:mt-0 sm:justify-end sm:inline-flex dark:text-zinc-200">
                            {isLoading ? (
                              <Placeholder
                                className="justify-end py-2"
                                color={Placeholder.color.GRAY}
                                width={Placeholder.width.HALF}
                              />
                            ) : (
                              <>{microToReadable(tokenYToReceive, tokenY['decimals'])}</>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4 lg:flex lg:items-start lg:justify-between">
                    <h4 className="text-xs font-normal text-gray-700 uppercase dark:text-zinc-100 font-headings">
                      Price
                    </h4>
                    {isLoading ? (
                      <Placeholder
                        className="justify-end"
                        color={Placeholder.color.GRAY}
                        width={Placeholder.width.HALF}
                      />
                    ) : (
                      <div className="mt-3 sm:mt-0 space-y-0.5 lg:text-right text-sm text-gray-500 dark:text-zinc-400">
                        <p>
                          1 {tokenX.name} ={' '}
                          {tokenYPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{' '}
                          {tokenY.name}
                        </p>
                        <p>
                          1 {tokenY.name} ={' '}
                          {tokenXPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{' '}
                          {tokenX.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 lg:flex lg:items-center lg:flex-1 lg:space-x-2">
                    <button
                      type="button"
                      disabled={tokenXToReceive === 0 || !foundPair}
                      onClick={() => removeLiquidity()}
                      className={classNames(
                        tokenXToReceive === 0 || !foundPair
                          ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer',
                        'w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-sm sm:text-xl rounded-md text-white hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      )}
                    >
                      {isLoading
                        ? 'Loading...'
                        : !foundPair
                        ? 'No liquidity for this pair. Try another one.'
                        : !percentageToRemove || percentageToRemove === 0
                        ? 'Please enter an amount'
                        : tokenXToReceive === 0
                        ? 'Please enter an amount'
                        : 'Remove liquidity'}
                    </button>
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
