import React from 'react';
import { Box } from '@blockstack/ui';

export const CreateVaultConfirm = ({ setStep, coinAmounts }) => {
  return (
    <Box>
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Confirm Vault Details
      </h2>

      <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Depositing
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              {coinAmounts['stx']} STX
            </p>
          </div>
          <hr/>

          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Minting
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              {coinAmounts['xusd']} xUSD
            </p>
          </div>
          <hr/>

          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Collateral to Debt Ratio
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              200
            </p>
          </div>
          <hr/>

          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Liquidation Ratio
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              150
            </p>
          </div>
          <hr/>

          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Liquidation Price
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              $0.7 / STX
            </p>
          </div>
          <hr/>

          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Liquidation Fee
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              $1
            </p>
          </div>
          <hr/>

          <div className="sm:flex sm:justify-between sm:items-baseline mt-4 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Stability Fee
            </h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-nowrap sm:mt-0 sm:ml-3">
              0.0%
            </p>
          </div>
          <hr/>
        </div>
      </div>

      <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
        <div className="max-w-xl text-sm text-gray-500">
          <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
            <button type="button" onClick={() => setStep(0)} className="mr-5 px-2.5 py-1.5 border border-gray-300 shadow-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Back
            </button>

            <button type="button" onClick={() => setStep(2)} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
              Open Vault
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
};
