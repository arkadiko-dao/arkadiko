import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext, UserBalanceKeys } from '@common/context';
import { getPrice } from '@common/get-price';
import { getLiquidationPrice, getCollateralToDebtRatio } from '@common/vault-utils';
import { InputAmount } from './input-amount';
import { useLocation } from 'react-router-dom';
import { QuestionMarkCircleIcon, InformationCircleIcon, ExternalLinkIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';

interface VaultProps {
  setStep: (arg: number) => void;
  setCoinAmounts: (arg: object) => void;
}

export const CreateVaultStepOne: React.FC<VaultProps> = ({ setStep, setCoinAmounts }) => {
  const [state, _] = useContext(AppContext);
  const search = useLocation().search;
  const tokenType = new URLSearchParams(search).get('type') || 'STX-A';
  const tokenName = new URLSearchParams(search).get('token') || 'STX';
  const tokenKey = tokenName.toLowerCase() as UserBalanceKeys;

  const continueVault = () => {
    setCoinAmounts({
      amounts: { collateral: collateralAmount, xusd: coinAmount },
      'liquidation-price': liquidationPrice,
      'collateral-to-debt-ratio': collateralToDebt,
      'liquidation-ratio': liquidationRatio,
      'liquidation-penalty': liquidationPenalty,
      'stability-fee-apy': stabilityFeeApy,
      'token-type': tokenType,
      'token-name': tokenName,
    });
    setStep(1);
  };
  const [collateralAmount, setCollateralAmount] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [maximumToMint, setMaximumToMint] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [collateralToDebt, setCollateralToDebt] = useState(0);
  const [stabilityFeeApy, setStabilityFeeApy] = useState(0);
  const [liquidationPenalty, setLiquidationPenalty] = useState(0);
  const [liquidationRatio, setLiquidationRatio] = useState(0);
  const [price, setPrice] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const maximumCoinsToMint = (value: string) => {
    const maxRatio = Math.max(200, parseInt(liquidationRatio, 10) + 30);
    const uCollateralAmount = parseInt(value, 10) * 1000000;
    setMaximumToMint(Math.floor((uCollateralAmount * price) / maxRatio));
  };

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getPrice(tokenName);
      setPrice(price);
    };

    fetchPrice();
  }, []);

  const setCollateral = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setCollateralAmount(value);
      const error = ['You cannot collateralize more than your balance'];
      if (parseFloat(value) >= state.balance[tokenKey] / 1000000) {
        setErrors(errors.concat(error));
      } else {
        const filteredAry = errors.filter(e => e !== error[0]);
        setErrors(filteredAry);
        maximumCoinsToMint(value);
      }
    },
    [state, tokenKey, errors]
  );

  const setCoins = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setCoinAmount(value);
      const error = [`You cannot mint more than ${maximumToMint / 1000000} xUSD`];
      const filteredAry = errors.filter(e => e !== error[0]);
      if (parseFloat(value) > maximumToMint / 1000000) {
        setErrors(filteredAry.concat(error));
      } else {
        setErrors(filteredAry);
      }
    },
    [state, errors]
  );

  const setMaxBalance = useCallback(() => {
    let balance = state.balance[tokenKey] / 1000000;
    if (tokenKey === 'stx') {
      const fee = 0.0004;
      balance -= fee;
    }
    const balanceString = balance.toString();
    setCollateralAmount(balanceString);
    maximumCoinsToMint(balanceString);
  }, [state, tokenKey, price]);

  const setMaxCoins = useCallback(() => {
    setCoinAmount((maximumToMint / 1000000).toString());
  }, [state, maximumToMint]);

  useEffect(() => {
    if (collateralAmount && coinAmount) {
      setLiquidationPrice(
        getLiquidationPrice(
          liquidationRatio,
          parseInt(coinAmount, 10),
          parseInt(collateralAmount, 10)
        )
      );
      setCollateralToDebt(
        getCollateralToDebtRatio(price, parseInt(coinAmount, 10), parseInt(collateralAmount, 10))
      );
    }
  }, [price, collateralAmount, coinAmount]);

  useEffect(() => {
    if (state.collateralTypes[tokenType.toUpperCase()]) {
      setStabilityFeeApy(state.collateralTypes[tokenType.toUpperCase()].stabilityFeeApy);
      setLiquidationPenalty(state.collateralTypes[tokenType.toUpperCase()].liquidationPenalty);
      setLiquidationRatio(state.collateralTypes[tokenType.toUpperCase()].liquidationRatio);
    }
  }, [tokenType, state.collateralTypes]);

  return (
    <>
      <section>
        <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
          <div>
            <h2 className="text-2xl leading-6 font-bold text-gray-900">Create a new vault</h2>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Deposit {tokenName} and generate xUSD
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
                <QuestionMarkCircleIcon className="text-indigo-600 h-5 w-5" aria-hidden="true" />
              </div>
              <a className="border-transparent text-indigo-500 hover:border-indigo-300 hover:text-indigo-700 inline-flex items-center px-2 text-sm font-medium" href="https://docs.arkadiko.finance/protocol/vaults" target="_blank" rel="noopener noreferrer">
                Need help with vaults?
                <ExternalLinkIcon className="block h-3 w-3 ml-2" aria-hidden="true" />
              </a>
            </div>

          </div>
        </header>

        <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            {errors.length > 0 ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    {errors.map(txt => (
                      <p className="text-sm text-red-700" key={txt}>
                        {txt}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              ``
            )}
                                            
            <form className="space-y-8 divide-y divide-gray-200">
              <div className="space-y-8 divide-y divide-gray-200">
                <div>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-8">
                    <div className="sm:col-span-4 space-y-6">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          How much {tokenName} do you want to collateralize?
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          The amount of {tokenName} you deposit determines how much xUSD you can generate
                        </p>

                        <div className="mt-4">
                          <InputAmount
                            balance={state.balance[tokenKey] / 1000000}
                            token={tokenName}
                            inputName="collateral"
                            inputId="collateralAmount"
                            inputValue={collateralAmount}
                            inputLabel={`Collateralize ${tokenName}`}
                            onInputChange={setCollateral}
                            onClickMax={setMaxBalance}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          How much xUSD would you like to mint?
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Mint an amount that is safely above the liquidation ratio
                        </p>
                        
                        <div className="mt-4">
                          <InputAmount
                            balance={maximumToMint / 1000000}
                            token="xUSD"
                            inputName="coins"
                            inputId="coinsAmount"
                            inputValue={coinAmount}
                            inputLabel="Mint xUSD"
                            onInputChange={setCoins}
                            onClickMax={setMaxCoins}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-start-6 sm:col-span-5">
                      <div className="w-full bg-indigo-50 border border-indigo-200 shadow-sm rounded-lg">
                        <dl className="sm:divide-y sm:divide-indigo-200">
                          <div className="sm:flex sm:items-center sm:flex-1 sm:flex-wrap p-3 sm:p-4">
                            <dt className="flex-shrink-0 text-sm font-medium text-indigo-500 inline-flex items-center sm:mr-2">
                              Collateral to Debt Ratio
                              <div className="ml-2">
                                <Tooltip shouldWrapChildren={true} label={`The amount of collateral you deposit in a vault versus the stablecoin debt you are minting against it`}>
                                  <InformationCircleIcon className="block h-5 w-5 text-indigo-400" aria-hidden="true" />
                                </Tooltip>
                              </div>
                            </dt>
                            <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:ml-auto">
                              {collateralToDebt > 0 ? ( 
                                <>
                                  {collateralToDebt}%
                                </>
                              ) : (
                                <>—</>
                              )}
                            </dd>
                          </div>

                          <div className="sm:flex sm:items-center sm:flex-1 sm:flex-wrap p-3 sm:p-4">
                            <dt className="flex-shrink-0 text-sm font-medium text-indigo-500 inline-flex items-center sm:mr-2">
                              Liquidation Price
                              <div className="ml-2">
                                <Tooltip shouldWrapChildren={true} label={`The price at which the vault gets tagged for auction`}>
                                  <InformationCircleIcon className="block h-5 w-5 text-indigo-400" aria-hidden="true" />
                                </Tooltip>
                              </div>
                            </dt>
                            <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:ml-auto">
                              {liquidationPrice > 0 ? ( 
                                <>
                                  ${liquidationPrice}%
                                </>
                              ) : (
                                <>—</>
                              )}
                            </dd>
                          </div>

                          <div className="sm:flex sm:items-center sm:flex-1 sm:flex-wrap p-3 sm:p-4">
                            <dt className="flex-shrink-0 text-sm font-medium text-indigo-500 inline-flex items-center sm:mr-2">
                              Current {tokenName} Price
                            </dt>
                            <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:ml-auto">
                              ${price / 100}
                            </dd>
                          </div>

                          <div className="sm:flex sm:items-center sm:flex-1 sm:flex-wrap p-3 sm:p-4">
                            <dt className="flex-shrink-0 text-sm font-medium text-indigo-500 inline-flex items-center sm:mr-2">
                              Stability Fee
                              <div className="ml-2">
                                <Tooltip shouldWrapChildren={true} label={`The interest in percentage to borrow xUSD`}>
                                  <InformationCircleIcon className="block h-5 w-5 text-indigo-400" aria-hidden="true" />
                                </Tooltip>
                              </div>
                            </dt>
                            <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:ml-auto">
                              {stabilityFeeApy / 100}%
                            </dd>
                          </div>

                          <div className="sm:flex sm:items-center sm:flex-1 sm:flex-wrap p-3 sm:p-4">
                            <dt className="flex-shrink-0 text-sm font-medium text-indigo-500 inline-flex items-center sm:mr-2">
                              Liquidation Ratio
                              <div className="ml-2">
                                <Tooltip shouldWrapChildren={true} label={`The collateral-to-debt ratio when your vault gets liquidated`}>
                                  <InformationCircleIcon className="block h-5 w-5 text-indigo-400" aria-hidden="true" />
                                </Tooltip>
                              </div>
                            </dt>
                            <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:ml-auto">
                              {liquidationRatio}%
                            </dd>
                          </div>

                          <div className="sm:flex sm:items-center sm:flex-1 sm:flex-wrap p-3 sm:p-4">
                            <dt className="flex-shrink-0 text-sm font-medium text-indigo-500 inline-flex items-center sm:mr-2">
                              Liquidation Penalty
                              <div className="ml-2">
                                <Tooltip shouldWrapChildren={true} label={`The penalty you pay when your vault gets liquidated`}>
                                  <InformationCircleIcon className="block h-5 w-5 text-indigo-400" aria-hidden="true" />
                                </Tooltip>
                              </div>
                            </dt>
                            <dd className="mt-1 sm:mt-0 text-indigo-900 text-sm sm:ml-auto">
                              {liquidationPenalty}%
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    disabled={!coinAmount || errors.length > 0}
                    onClick={() => continueVault()}
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};
