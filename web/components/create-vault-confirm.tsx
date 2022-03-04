import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { QuestionMarkCircleIcon, ExternalLinkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/solid';
import { useLocation } from 'react-router-dom';
import { Alert } from './ui/alert';
import { NewVaultWizardNav } from './new-vault-wizard-nav';

export const CreateVaultConfirm = ({ setStep, coinAmounts, setCoinAmounts }) => {
  const [state] = useContext(AppContext);
  const search = useLocation().search;
  const tokenName = new URLSearchParams(search).get('token') || 'STX';
  const currentSection = 2;

  const endDate = Date.parse(state.endDate);
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  const availableTokensDate = endDate + 6 * msInWeek; // 6-week stacking
  const tokensAvailability = new Date(availableTokensDate)
    .toDateString()
    .split(' ')
    .slice(1)
    .join(' ');

  const togglePox = () => {
    const newState = !coinAmounts['stack-pox'];
    let autoPayoff = coinAmounts['auto-payoff'];
    if (!newState) {
      autoPayoff = false;
    }
    setCoinAmounts(prevState => ({
      ...prevState,
      'stack-pox': newState,
      'auto-payoff': autoPayoff,
    }));
  };

  return (
    <>
      <NewVaultWizardNav currentSection={currentSection} setStep={setStep} />

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
                <QuestionMarkCircleIcon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              </div>
              <a
                className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
                href="https://docs.arkadiko.finance/protocol/vaults"
                target="_blank"
                rel="noopener noreferrer"
              >
                More on vaults parameters
                <ExternalLinkIcon className="block w-3 h-3 ml-2" aria-hidden="true" />
              </a>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto mt-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 space-y-6 bg-white dark:bg-zinc-900 sm:p-6">
            {tokenName.includes('STX') ? (
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Stacking
                  </h3>

                  {coinAmounts['stack-pox'] ? (
                    <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      <CheckCircleIcon className="flex-shrink-0 w-5 h-5 mr-2" />
                      Enable
                    </span>
                  ) : (
                    <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                      <XCircleIcon className="flex-shrink-0 w-5 h-5 mr-2" />
                      Disable
                    </span>
                  )}
                </div>

                <label className="flex items-center mt-6 space-x-3">
                  <input
                    type="checkbox"
                    className="w-6 h-6 border border-gray-300 rounded-md appearance-none form-tick checked:bg-indigo-600 checked:border-transparent focus:outline-none"
                    checked={coinAmounts['stack-pox']}
                    onChange={() => togglePox()}
                  />
                  <span className="text-gray-900 dark:text-zinc-100">
                    I want to stack my STX tokens to earn yield
                  </span>
                </label>

                {coinAmounts['stack-pox'] ? (
                  <div className="mt-4">
                    <Alert type={Alert.type.WARNING} title="Important note">
                      <p>
                        Choosing to stack your STX means that they will be <span className="font-semibold">locked and become
                        illiquid immediately</span>.
                      </p>
                      <p className="mt-1">
                        They will be available again on:{' '}
                        <span className="font-semibold">{tokensAvailability}</span> (End of the{' '}
                        <a
                          href="https://stacking.club/cycles/next"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-yellow-700 underline hover:text-yellow-600"
                        >
                          next PoX cycle
                        </a>
                        : {state.endDate} + 6-week stacking phase + 2-week cooldown period).
                      </p>

                      <p className="mt-1">
                        <a
                          href="https://stacking.club/learn"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-yellow-700 underline hover:text-yellow-600"
                        >
                          Learn more about the PoX cycle.
                        </a>
                      </p>
                    </Alert>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-4 shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 space-y-6 bg-white dark:bg-zinc-900 sm:p-6">
            <div className="space-y-8 divide-y divide-gray-200 dark:divide-zinc-600">
              <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                <div className="sm:flex sm:justify-between sm:items-baseline">
                  <div>
                    <h3 className="mb-2 text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Depositing
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 sm:max-w-2xl">
                      The amount of {coinAmounts['token-name']} tokens that you are depositing into
                      your vault.
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-600 dark:text-zinc-400 whitespace-nowrap sm:mt-0 sm:ml-3">
                    {coinAmounts['amounts']['collateral']} {coinAmounts['token-name']}
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
                    ${coinAmounts['liquidation-price']} / {coinAmounts['token-name']}
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

                {tokenName.includes('STX') ? (
                  <div className="pt-4">
                    <div className="mt-2 mb-4">
                      <Alert type={Alert.type.WARNING} title="Important note">
                        <p className="">
                          Choosing to stack your STX means that they will be locked and become
                          illiquid immediately. They will be available again on:{' '}
                          <span className="font-semibold">{tokensAvailability}</span> (End of the{' '}
                          <a
                            href="https://stacking.club/cycles/next"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-yellow-700 underline hover:text-yellow-600"
                          >
                            next PoX cycle
                          </a>
                          : {state.endDate} + 6-week stacking phase + 2-week cooldown period).
                        </p>

                        <p className="mt-1">
                          <a
                            href="https://stacking.club/learn"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-yellow-700 underline hover:text-yellow-600"
                          >
                            Learn more about the PoX cycle.
                          </a>
                        </p>
                      </Alert>
                    </div>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-6 h-6 border border-gray-300 rounded-md appearance-none form-tick checked:bg-indigo-600 checked:border-transparent focus:outline-none"
                        checked={coinAmounts['stack-pox']}
                        onChange={() => togglePox()}
                      />
                      <span className="text-gray-900 dark:text-zinc-100">
                        I want my STX tokens stacked to earn yield
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
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
