import React, { useContext, useEffect, useState } from 'react';
import { Box } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { getPrice } from '@common/get-price';
import { getLiquidationPrice, getCollateralToDebtRatio } from '@common/vault-utils';
import { useLocation } from "react-router-dom";

interface VaultProps {
  setStep: (arg: number) => void;
  setCoinAmounts: (arg: object) => void;
}

export const CreateVaultStepOne: React.FC<VaultProps> = ({ setStep, setCoinAmounts }) => {
  const [state, _] = useContext(AppContext);
  const search = useLocation().search;
  const tokenType = new URLSearchParams(search).get('type') || 'STX-A';
  const tokenName = new URLSearchParams(search).get('token') || 'STX';

  const continueVault = () => {
    setCoinAmounts({
      amounts: { collateral: collateralAmount, xusd: coinAmount },
      'liquidation-price': liquidationPrice,
      'collateral-to-debt-ratio': collateralToDebt,
      'liquidation-ratio': liquidationRatio,
      'liquidation-penalty': liquidationPenalty,
      'stability-fee-apy': stabilityFeeApy,
      'token-type': tokenType,
      'token-name': tokenName
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
  const [errors, setErrors] = useState<Array<string>>([]);
  const [validCollateralValue, setValidCollateralValue] = useState(false);
  const [validMintValue, setValidMintValue] = useState(false);

  const maximumCoinsToMint = (value: string) => {
    const maxRatio = parseInt(liquidationRatio, 10) + 30;
    const uCollateralAmount = parseInt(value, 10) * 1000000;
    setMaximumToMint(Math.floor(uCollateralAmount * price / maxRatio));
  };

  useEffect(() => {
    const fetchPrice = async () => {
      let price = await getPrice(tokenName);
      setPrice(price);
    };

    fetchPrice();
  }, [])

  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'collateral') {
      setCollateralAmount(value);
      const error = ['You cannot collateralize more than your balance'];
      if (value > (state.balance[tokenName.toLowerCase()] / 1000000)) {
        setErrors(errors.concat(error));
        setValidCollateralValue(false);
      } else {
        setValidCollateralValue(true);
        let filteredAry = errors.filter(e => e !== error[0]);
        setErrors(filteredAry);
        maximumCoinsToMint(value);
      }
    } else {
      setCoinAmount(value);
      const error = [`You cannot mint more than ${maximumToMint / 1000000} xUSD`];
      if (value > maximumToMint / 1000000) {
        setErrors(errors.concat(error));
        setValidMintValue(false);
      } else {
        let filteredAry = errors.filter(e => e !== error[0]);
        setErrors(filteredAry);
        setValidMintValue(true);
      }
    }
  };

  useEffect(() => {
    if (collateralAmount && coinAmount) {
      setLiquidationPrice(getLiquidationPrice(liquidationRatio, parseInt(coinAmount, 10), parseInt(collateralAmount, 10)));
      setCollateralToDebt(getCollateralToDebtRatio(price, parseInt(coinAmount, 10), parseInt(collateralAmount, 10)));
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
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Deposit {tokenName} and generate xUSD
      </h2>

      <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-3">
        <li className="relative col-span-3 flex shadow-sm rounded-md">
          <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
            {errors.length > 0 ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    {errors.map(txt => <p className="text-sm text-red-700" key={txt}>{txt}</p>)}
                  </div>
                </div>
              </div>
            ) : `` }

            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How much {tokenName} do you want to collateralize?
              </h3>
              <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p>
                    The amount of {tokenName} you deposit determines how much xUSD you can generate
                  </p>
                </div>
              </div>
              <div className="mt-2 mb-1 sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        
                      </span>
                    </div>
                    <input type="text" name="collateral" id="collateralAmount"
                           value={collateralAmount}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="collateral-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="collateral-currency">
                        {tokenName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Your balance: {state.balance[tokenName.toLowerCase()] / 1000000} {tokenName}
                  </p>
                </div>
              </div>

              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-10">
                How much xUSD would you like to mint?
              </h3>
              <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p>
                    Mint an amount that is safely above the liquidation ratio
                  </p>
                </div>
              </div>
              <div className="mt-2 mb-1 sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        $
                      </span>
                    </div>
                    <input type="text" name="coins" id="coinAmount"
                           value={coinAmount}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="coin-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="coin-currency">
                        xUSD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Maximum to mint: {maximumToMint / 1000000} xUSD
                  </p>
                </div>
              </div>

            </div>
          </div>
        </li>
        <li className="relative col-span-1 flex shadow-sm rounded-md">
          <div className="bg-white shadow sm:rounded-lg mt-5">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-md leading-6 font-medium text-gray-900">
                Collateral to Debt Ratio
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {collateralToDebt}%
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Price
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                ${liquidationPrice}
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Current {tokenName} Price
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                ${price / 100}
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Stability Fee
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {stabilityFeeApy / 100}%
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Ratio
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {liquidationRatio}%
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Penalty
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {liquidationPenalty}%
              </p>
            </div>
          </div>
        </li>
      </ul>

      <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
        <div className="max-w-xl text-sm text-gray-500">
          <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
            <button type="button" disabled={!coinAmount || errors.length > 0} onClick={() => continueVault()} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
              Continue
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
};
