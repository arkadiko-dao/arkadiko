import React, { useContext, useState } from 'react';
import { Helmet } from 'react-helmet';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { VaultGroup } from './vault-group';
import { AppContext } from '@common/context';
import { useEffect } from 'react';
import { VaultProps } from './vault';
import { EmptyState } from './ui/empty-state';
import { ArchiveIcon } from '@heroicons/react/outline';
import { Placeholder } from './ui/placeholder';
import { Prices } from './prices';
import { NavLink as RouterLink } from 'react-router-dom';
import { CollateralCard } from './collateral-card';

export const Mint = () => {
  const address = useSTXAddress();
  const [state, setState] = useContext(AppContext);
  const [{ vaults, collateralTypes }, _x] = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [loadingVaults, setLoadingVaults] = useState(true);

  useEffect(() => {
    const fetchVault = async (vaultId: number) => {
      const vault = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vault-data-v1-1',
        functionName: 'get-vault-by-id',
        functionArgs: [uintCV(vaultId)],
        senderAddress: address || '',
        network: network,
      });
      const json = cvToJSON(vault);
      return json;
    };

    async function asyncForEach(array: any, callback: any) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const fetchVaults = async () => {
      const vaults = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-vault-data-v1-1',
        functionName: 'get-vault-entries',
        functionArgs: [standardPrincipalCV(address || '')],
        senderAddress: address || '',
        network: network,
      });
      const json = cvToJSON(vaults);
      const arr: VaultProps[] = [];

      await asyncForEach(json.value.ids.value, async (vaultId: any) => {
        if (Number(vaultId.value) !== 0) {
          const vault = await fetchVault(vaultId.value);
          const data = vault.value;
          arr.push({
            key: data['id'].value,
            id: data['id'].value,
            owner: data['owner'].value,
            collateral: data['collateral'].value,
            collateralType: data['collateral-type'].value,
            collateralToken: data['collateral-token'].value,
            isLiquidated: data['is-liquidated'].value,
            auctionEnded: data['auction-ended'].value,
            leftoverCollateral: data['leftover-collateral'].value,
            debt: data['debt'].value,
            stackedTokens: data['stacked-tokens'].value,
            collateralData: {},
          });
        }
      });

      setState(prevState => ({
        ...prevState,
        vaults: arr,
      }));
      setLoadingVaults(false);
    };

    fetchVaults();
  }, []);

  return (
    <div>
      <Helmet>
        <title>Vaults</title>
      </Helmet>

      <main className="py-12">
        <section>
          <div className="relative">
            <div
              className="absolute w-full h-full"
              style={{ backgroundImage: 'url(/assets/stacks-pattern.png)', backgroundSize: '20%' }}
            />
            <a
              className="absolute bottom-0 right-0 z-10 p-2 mb-2 mr-2 bg-indigo-600 rounded-full"
              href="https://stacking.club/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 120 121"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M108.897 120.001L83.4366 81.4259H120V66.872H0V81.4428H36.5512L11.1027 120.001H30.0887L60.0001 74.6811L89.9113 120.001H108.897ZM120 52.7468V38.0464H84.1795L109.29 0H90.3043L59.9997 45.9149L29.6957 0H10.7099L35.8527 38.0805H0V52.7468H120Z"
                  fill="white"
                />
              </svg>
            </a>

            <dl className="relative grid grid-cols-1 overflow-hidden bg-indigo-100 bg-opacity-50 border border-indigo-200 divide-y divide-indigo-200 rounded-lg shadow-sm md:grid-cols-4 md:divide-y-0 md:divide-x dark:bg-zinc-700 dark:bg-opacity-95 dark:border-zinc-600 dark:divide-zinc-600">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase dark:text-indigo-200">
                  Stacking Cycle #
                </dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  <div className="flex items-baseline text-2xl font-semibold text-indigo-600 dark:text-indigo-100">
                    {state.cycleNumber}
                  </div>
                </dd>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase dark:text-indigo-200">
                  End date
                </dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  <div className="flex items-baseline text-2xl font-semibold text-indigo-600 dark:text-indigo-100">
                    {state.endDate}
                  </div>
                </dd>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase dark:text-indigo-200">
                  Days in cycle
                </dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  <div className="flex items-baseline text-2xl font-semibold text-indigo-600 dark:text-indigo-100">
                    {state.daysPassed}
                  </div>
                </dd>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-semibold text-indigo-800 uppercase dark:text-indigo-200">
                  Days left
                </dt>
                <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
                  <div className="flex items-baseline text-2xl font-semibold text-indigo-600 dark:text-indigo-100">
                    {state.daysLeft}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-12">
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:items-end sm:justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Your positions
            </h3>

            {vaults.length &&
            Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
              <div>
                <RouterLink
                  to={`/vaults/new`}
                  exact
                  className="inline-flex px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Vault
                </RouterLink>
              </div>
            ) : null}
          </header>

          {vaults.length &&
          Object.keys(collateralTypes).length === state.definedCollateralTypes.length ? (
            <VaultGroup vaults={vaults} />
          ) : loadingVaults === true ? (
            <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle rounded-lg sm:shadow">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      <Placeholder color={Placeholder.color.GRAY} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-zinc-800">
                    <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                      <Placeholder />
                    </td>
                  </tr>
                  <tr className="bg-white dark:bg-zinc-800">
                    <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
                      <Placeholder />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <EmptyState
                Icon={ArchiveIcon}
                title="You currently have no open positions."
              >
                <p className="mt-2 text-base text-gray-500 dark:text-zinc-400 md:ml-8">
                  Start creating <a className="text-indigo-500 underline decoration-1 dark:text-indigo-300 underline-offset-2 dark:hover:text-indigo-200 hover:text-indigo-700" href="#borrow">a new vault below</a> and unleash the power of self repaying-loans!
                </p>
              </EmptyState>
            </>
          )}
        </section>

        <section className="mt-12" id="borrow">
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Start borrowing
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Borrow against your favorite assets now.
            </p>
          </header>
          <div className="flex items-center justify-center mt-4 space-x-8">
            {/* <div className="grid grid-cols-1 gap-8 mt-4 sm:grid-cols-3"> */}
              <CollateralCard types={collateralTypes} />
            {/* </div> */}
          </div>

        </section>

        <Prices />
      </main>
    </div>
  );
};
