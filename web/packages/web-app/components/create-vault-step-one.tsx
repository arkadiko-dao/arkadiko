import React, { useContext, useEffect, useState } from 'react';
import { Box } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { getStxPrice } from '@common/get-stx-price';
import { getLiquidationPrice, getCollateralToDebtRatio } from '@common/vault-utils';

interface VaultProps {
  setStep: (arg: number) => void;
  setCoinAmounts: (arg: object) => void;
}

export const CreateVaultStepOne: React.FC<VaultProps> = ({ setStep, setCoinAmounts }) => {
  const state = useContext(AppContext);
  const continueVault = () => {
    setCoinAmounts({
      amounts: { stx: stxAmount, xusd: coinAmount },
      'liquidation-price': liquidationPrice,
      'collateral-to-debt-ratio': collateralToDebt
    });
    setStep(1);
  };
  const [stxAmount, setStxAmount] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [maximumToMint, setMaximumToMint] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [collateralToDebt, setCollateralToDebt] = useState(0);
  const price = parseFloat(getStxPrice().price);

  const maximumCoinsToMint = (value: string) => {
    const maxRatio = parseInt(state.riskParameters['liquidation-ratio'], 10) + 30;
    const ustxAmount = parseInt(value, 10) * 1000000;
    setMaximumToMint(Math.floor(ustxAmount * price / maxRatio));
  };

  const onInputChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'stx') {
      setStxAmount(value);
      maximumCoinsToMint(value);
    } else {
      setCoinAmount(value);
    }
  };

  useEffect(() => {
    if (stxAmount && coinAmount) {
      const liquidationRatio = parseInt(state.riskParameters['liquidation-ratio'], 10);
      setLiquidationPrice(getLiquidationPrice(liquidationRatio, parseInt(coinAmount, 10), parseInt(stxAmount, 10)));
      setCollateralToDebt(getCollateralToDebtRatio(price, parseInt(coinAmount, 10), parseInt(stxAmount, 10)));
    }
  }, [stxAmount, coinAmount]);

  return (
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Deposit STX and generate xUSD
      </h2>

      <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-3">
        <li className="relative col-span-3 flex shadow-sm rounded-md">
          <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How much STX do you want to collateralize?
              </h3>
              <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p>
                    The amount of STX you deposit determines how much xUSD you can generate
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
                    <input type="text" name="stx" id="stxAmount"
                           value={stxAmount}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="stx-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stx-currency">
                        STX
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Your balance: {state.balance['stx'] / 1000000} STX
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
                {collateralToDebt}
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Price
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                ${liquidationPrice}
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Current STX Price
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                ${price / 100}
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Stability Fee
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {state.riskParameters['stability-fee-apy']}%
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Ratio
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {state.riskParameters['liquidation-ratio']}%
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Penalty
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                {state.riskParameters['liquidation-penalty']}%
              </p>
            </div>
          </div>
        </li>
      </ul>

      <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
        <div className="max-w-xl text-sm text-gray-500">
          <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
            <button type="button" disabled={!coinAmount} onClick={() => continueVault()} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
              Continue
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
};
