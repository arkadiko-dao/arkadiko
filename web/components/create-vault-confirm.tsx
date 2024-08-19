import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { useLocation } from 'react-router-dom';
import { Alert } from './ui/alert';
import { NewVaultWizardNav } from './new-vault-wizard-nav';
import { StyledIcon } from './ui/styled-icon';
import { tokenNameToTicker } from '@common/vault-utils';

export const CreateVaultConfirm = ({ setStep, coinAmounts, setCoinAmounts }) => {
  const [state] = useContext(AppContext);
  const search = useLocation().search;
  const tokenName = new URLSearchParams(search).get('token') || 'STX';

  return (
    <>
      <NewVaultWizardNav currentSection={2} setStep={setStep} />

      <section className="mt-8">
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <div>
            <h2 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Vault creation confirmation
            </h2>
            <p className="max-w-4xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Overview of your vault's parameters
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <div className="w-5.5 h-5.5 rounded-full bg-indigo-200 flex items-center justify-center">
                <StyledIcon as="QuestionMarkCircleIcon" size={5} className="text-indigo-600" />
              </div>
              <a
                className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                href="https://docs.arkadiko.finance/protocol/vaults"
                target="_blank"
                rel="noopener noreferrer"
              >
                More on vaults parameters
                <StyledIcon as="ExternalLinkIcon" size={3} className="block ml-2" />
              </a>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto mt-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 space-y-6 bg-white dark:bg-zinc-800 sm:p-6">
            <div className="space-y-8 divide-y divide-gray-200 dark:divide-zinc-600">
              <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                <div className="sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Depositing
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      The amount of {tokenNameToTicker(coinAmounts['token-name'])} tokens that you are depositing into
                      your vault.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['amounts']['collateral']} {tokenNameToTicker(coinAmounts['token-name'])}
                  </p>
                </div>

                <div className="pt-4 sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Minting
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      The total amount of USDA that you want to mint.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['amounts']['usda']} USDA
                  </p>
                </div>

                <div className="pt-4 sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Collateral to Debt Ratio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      Indicates the amount of collateral you deposit in a vault versus the
                      stablecoin debt you are minting against it. Ideal values are over 250%.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['collateral-to-debt-ratio'].toFixed(2)}%
                  </p>
                </div>

                <div className="pt-4 sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Liquidation Ratio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      When the value of your vault versus the value of your debt dips below the set
                      liquidation ratio, your vault becomes eligible for auction. We advise a 200%+
                      ratio at all times, to be safe during periods of high market volatility.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['liquidation-ratio']}%
                  </p>
                </div>

                <div className="pt-4 sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Liquidation Price
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      The price at which your vault gets tagged for auction.{' '}
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    ${coinAmounts['liquidation-price']} / {tokenNameToTicker(coinAmounts['token-name'])}
                  </p>
                </div>

                <div className="pt-4 sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Liquidation Penalty
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      The liquidation penalty is the loss of value you experience when a Liquidator
                      needs to step in to clear your debt when your vault has been tagged for
                      auction.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['liquidation-penalty']}%
                  </p>
                </div>

                <div className="pt-4 sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Stability Fee
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      This is the total cost of borrowing for a vault. A stability fee of{' '}
                      {coinAmounts['stability-fee-apy'] / 100}% means that any debt you create will
                      increase by {coinAmounts['stability-fee-apy'] / 100}% over the period of one
                      year. Think of it as yearly interest on your USDA loan.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['stability-fee-apy'] / 100}%
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Alert type={Alert.type.WARNING} title="Important note">
                  <p>
                    By opening a vault you confirm that you understand the risks of a DeFi platform, including{' '}
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

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex justify-center px-4 py-2 ml-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
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
