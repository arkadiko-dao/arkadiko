import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { CollateralType } from '@components/collateral-type';
import { NewVaultWizardNav } from './new-vault-wizard-nav';
import { tokenList } from '@components/token-swap-list';
import { useHistory, NavLink as RouterLink } from 'react-router-dom';

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
            <RouterLink
              to={'/vaults/new?token=stx'}
              onClick={() => setStep(1)}
              exact
              className="border border-transparent w-1/2 p-6 text-lg font-semibold text-center text-gray-500 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-md shadow md:w-1/6 hover:bg-white/80"
            >
              <img className="w-10 h-10 mx-auto mb-3 rounded-full" src={tokenList[2].logo} alt="" />
              STX
            </RouterLink>

            <RouterLink
              to={'/vaults/new?token=xbtc'}
              onClick={() => setStep(1)}
              exact
              className="border border-transparent w-1/2 p-6 ml-6 text-lg font-semibold text-center text-gray-500 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-md shadow md:w-1/6 hover:bg-white/80"
            >
              <img className="w-10 h-10 mx-auto mb-3 rounded-full" src={tokenList[3].logo} alt="" />
              xBTC
            </RouterLink>

            <RouterLink
              to={'/vaults/new?token=atalex'}
              onClick={() => setStep(1)}
              exact
              className="border border-transparent w-1/2 p-6 ml-6 text-lg font-semibold text-center text-gray-500 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-md shadow md:w-1/6 hover:bg-white/80"
            >
              <img className="w-10 h-10 mx-auto mb-3 rounded-full" src={tokenList[7].logo} alt="" />
              atALEX
            </RouterLink>
          </div>
        </div>
      </section>
    </>
  );
};
