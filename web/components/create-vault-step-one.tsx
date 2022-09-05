import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { CollateralType } from '@components/collateral-type';
import { NewVaultWizardNav } from './new-vault-wizard-nav';
import { tokenList } from '@components/token-swap-list';
import { useHistory } from 'react-router-dom';

interface VaultProps {
  setStep: (arg: number) => void;
}

export const CreateVaultStepOne: React.FC<VaultProps> = ({ setStep }) => {
  const [{ collateralTypes }, _x] = useContext(AppContext);
  const [collateralTypeChoice, setCollateralTypeChoice] = useState('');
  const currentSection = 0;
  const history = useHistory();

  useEffect(() => {
    setStep(0);
  }, []);

  const stxCollateralTypes = Object.fromEntries(
    Object.entries(collateralTypes).filter(([key]) => key.includes('STX'))
  );
  const xBtcCollateralTypes = Object.fromEntries(
    Object.entries(collateralTypes).filter(([key]) => key.includes('XBTC'))
  );
  const atAlexCollateralTypes = Object.fromEntries(
    Object.entries(collateralTypes).filter(([key]) => key.includes('ATALEX'))
  );

  return (
    <>
      <NewVaultWizardNav currentSection={currentSection} setStep={setStep} />

      <section className="mt-8">
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <h2 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
            Choose your collateral
          </h2>
        </header>

        <div className="flex flex-col mt-4">
          <div className="flex items-center justify-center mb-6">
            <button
              type="button"
              className={`w-1/2 p-6 text-lg font-semibold text-center text-gray-500 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-md shadow md:w-1/6 hover:bg-white/80 ${
                collateralTypeChoice === 'stx' || (location.hash.indexOf('stx') === 1)
                  ? 'border border-indigo-500/60'
                  : 'border border-transparent'
              }`}
              onClick={
                () => {
                  setCollateralTypeChoice('stx');
                  history.push(`#stx`);
                }
              }
            >
              <img className="w-10 h-10 mx-auto mb-3 rounded-full" src={tokenList[2].logo} alt="" />
              STX
            </button>

            <button
              type="button"
              className={`w-1/2 p-6 ml-6 text-lg font-semibold text-center text-gray-500 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-md shadow md:w-1/6 hover:bg-white/80 ${
                collateralTypeChoice === 'xbtc' || (location.hash.indexOf('xbtc') === 1)
                  ? 'border border-indigo-500/60'
                  : 'border border-transparent'
              }`}
              onClick={
                () => {
                  setCollateralTypeChoice('xbtc');
                  history.push(`#xbtc`);
                }
              }
            >
              <img className="w-10 h-10 mx-auto mb-3 rounded-full" src={tokenList[3].logo} alt="" />
              xBTC
            </button>

            <button
              type="button"
              className={`w-1/2 p-6 ml-6 text-lg font-semibold text-center text-gray-500 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-md shadow md:w-1/6 hover:bg-white/80 ${
                collateralTypeChoice === 'auto-alex' || (location.hash.indexOf('auto-alex') === 1)
                  ? 'border border-indigo-500/60'
                  : 'border border-transparent'
              }`}
              onClick={
                () => {
                  setCollateralTypeChoice('auto-alex');
                  history.push(`#auto-alex`);
                }
              }
            >
              <img className="w-10 h-10 mx-auto mb-3 rounded-full" src={tokenList[7].logo} alt="" />
              atALEX
            </button>
          </div>

          <div className="md:max-w-4xl md:mx-auto">
            {collateralTypeChoice === 'stx' || (location.hash.indexOf('stx') === 1) ? (
              <CollateralType types={stxCollateralTypes} setStep={setStep} />
            ) : collateralTypeChoice === 'xbtc' || (location.hash.indexOf('xbtc') === 1) ? (
              <CollateralType types={xBtcCollateralTypes} setStep={setStep} />
            ) : collateralTypeChoice === 'auto-alex' || (location.hash.indexOf('auto-alex') === 1) ? (
              <CollateralType types={atAlexCollateralTypes} setStep={setStep} />
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
};
