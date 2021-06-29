import React from 'react';
import { QuestionMarkCircleIcon, ExternalLinkIcon } from '@heroicons/react/solid';


export const CreateVaultConfirm = ({ setStep, coinAmounts }) => {
  return (
    <>
      <section>
        <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
          <div>
            <h2 className="text-2xl leading-6 font-bold text-gray-900">Vault creation confirmation</h2>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Overview of your vault's parameters
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
                <QuestionMarkCircleIcon className="text-indigo-600 h-5 w-5" aria-hidden="true" />
              </div>
              <a className="border-transparent text-indigo-500 hover:border-indigo-300 hover:text-indigo-700 inline-flex items-center px-2 text-sm font-medium" href="https://docs.arkadiko.finance/protocol/vaults" target="_blank" rel="noopener noreferrer">
                More on vaults parameters
                <ExternalLinkIcon className="block h-3 w-3 ml-2" aria-hidden="true" />
              </a>
            </div>
          </div>
        </header>
        
        <div className="mt-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <div className="space-y-8 divide-y divide-gray-200">
              <div className="space-y-4 divide-y divide-gray-100">

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Depositing
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">The amount of {coinAmounts['token-name']} tokens that your are depositing into your vault.</p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['amounts']['collateral']} {coinAmounts['token-name']}
                  </p>
                </div>

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Minting
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">The total amount of USDA that you want to mint.</p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['amounts']['usda']} USDA
                  </p>
                </div>

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Collateral to Debt Ratio
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">Indicates the amount of collateral you deposit in a vault versus the stablecoin debt you are minting against it. Ideal values are over 250%.</p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['collateral-to-debt-ratio'].toFixed(2)}%
                  </p>
                </div>

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Liquidation Ratio
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">When the value of your vault versus the value of your debt dips below the set liquidation ratio, your vault becomes eligible for auction. We advise a 200%+ ratio at all times, to be safe during periods of high market volatility.</p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['liquidation-ratio']}%
                  </p>
                </div>

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Liquidation Price
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">The price at which your vault gets tagged for auction. </p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    ${coinAmounts['liquidation-price']} / {coinAmounts['token-name']}
                  </p>
                </div>

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Liquidation Penalty
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">The liquidation penalty is the loss of value you experience when a Liquidator needs to step in to clear your debt when your vault has been tagged for auction.</p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['liquidation-penalty']}%
                  </p>
                </div>

                <div className="sm:flex sm:justify-between sm:items-baseline pt-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Stability Fee
                    </h3>
                    <p className="text-sm sm:max-w-2xl text-gray-600">This is the total cost of borrowing for a vault. A stability fee of {coinAmounts['stability-fee-apy'] / 100}% means that any debt you create will increase by {coinAmounts['stability-fee-apy'] / 100}% over the period of one year. Think of it as yearly interest on your USDA loan.</p>
                  </div>
                  <p className="mt-1 text-lg text-gray-600 font-bold whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['stability-fee-apy'] / 100}%
                  </p>
                </div>
              </div>
              <div className="pt-5">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep(0)} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md bg-white-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Back
                  </button>

                  <button type="button" onClick={() => setStep(2)} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Open Vault
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};
