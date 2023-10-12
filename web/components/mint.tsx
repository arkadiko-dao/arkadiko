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
        contractName: 'arkadiko-vault-data-v1-1', // TODO: fetch all vaults
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

    if (address != undefined) {
      fetchVaults();
    }
  }, []);

  return (
    <div>
      <Helmet>
        <title>Vaults</title>
      </Helmet>

      <main className="py-12">
        {state.userData ? (
          <section>
            <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:items-end sm:justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                Your positions
              </h3>
            </header>

            {vaults.length ? (
              <VaultGroup vaults={vaults} />
            ) : loadingVaults ? (
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
        ) : null}

        <section className="mt-12" id="borrow">
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Start borrowing
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Borrow against your favorite assets now.
            </p>
          </header>
          <div className="mt-4 space-y-8 sm:space-x-8 sm:flex sm:items-center sm:justify-center sm:space-y-0">
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
