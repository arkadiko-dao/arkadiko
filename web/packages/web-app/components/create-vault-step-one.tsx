import React from 'react';
import { Box } from '@blockstack/ui';

interface VaultProps {
  setStep: () => void;
  setCoinAmounts: () => void;
}

export const CreateVaultStepOne: React.FC<VaultProps> = ({ setStep, setCoinAmounts }) => {
  const continueVault = () => {
    console.log('blaat');
    setCoinAmounts({ stx: 10, xusd: 5 });
    setStep(1);
  };

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
                        $
                      </span>
                    </div>
                    <input type="text" name="price" id="price" className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00" aria-describedby="price-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="price-currency">
                        STX
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Your balance: 5 STX
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
                    <input type="text" name="price" id="price" className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00" aria-describedby="price-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="price-currency">
                        xUSD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:flex sm:items-start sm:justify-between">
                <div className="max-w-xl text-sm text-gray-500">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Your balance: 0 xUSD
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
                200
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Price
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                $0
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Current Price
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                $0
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Stability Fee
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                0.0%
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Ratio
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                150
              </p>

              <h3 className="text-md leading-6 font-medium text-gray-900">
                Liquidation Penalty
              </h3>
              <p className="max-w-xl text-sm text-gray-500 mb-3">
                13%
              </p>
            </div>
          </div>
        </li>
      </ul>

      <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
        <div className="max-w-xl text-sm text-gray-500">
          <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
            <button type="button" onClick={() => continueVault()} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
              Continue
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
};
