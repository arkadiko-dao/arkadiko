import React, { useContext, useState } from 'react';
import { Helmet } from 'react-helmet';
import { stacksNetwork as network, asyncForEach } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { VaultGroup } from './vault-group';
import { AppContext } from '@common/context';
import { useEffect } from 'react';
import { VaultProps } from './vault';
import { EmptyState } from './ui/empty-state';
import { ArchiveIcon } from '@heroicons/react/outline';
import { Placeholder } from './ui/placeholder';
import { Prices } from './prices';
import { CollateralCard } from './collateral-card';

// TODO: extract to utils
const tokenToName = (token: string) => {
  if (token === 'wrapped-stx-token') {
    return 'STX';
  } else if (token === 'arkadiko-token') {
    return 'DIKO';
  } else if (token === 'usda-token') {
    return 'USDA';
  } else if (token === 'Wrapped-Bitcoin') {
    return 'xBTC';
  } else if (token === 'welshcorgicoin-token') {
    return 'WELSH';
  } else if (token === 'wrapped-lydian-token') {
    return 'wLDN';
  } else if (token === 'lydian-token') {
    return 'LDN';
  } else if (token === 'wstx-token') {
    return 'STX';
  } else if (token === 'auto-alex-v2') {
    return 'atALEXv2';
  } else if (token === 'ststx-token') {
    return 'stSTX';
  } else {
    return '';
  }
};

export const Mint = () => {
  const address = useSTXAddress();
  const [state, setState] = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [loadingVaults, setLoadingVaults] = useState(true);

  useEffect(() => {
    const fetchVaults = async () => {
      const vaults = {};
      await asyncForEach(state.definedCollateralTypes, async tokenAddress => {
        const tokenParts = tokenAddress.split('.');

        const vaultCall = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-vaults-data-v1-1',
          functionName: 'get-vault',
          functionArgs: [standardPrincipalCV(address || ''), contractPrincipalCV(tokenParts[0], tokenParts[1])],
          senderAddress: address || '',
          network: network,
        });
        const json = cvToJSON(vaultCall);
        const vault = json.value.value;
        console.log('vault', tokenAddress, vault, tokenParts[1]);
        const collateralToken = tokenToName(tokenParts[1]);
        vaults[collateralToken] = {
          key: tokenAddress,
          owner: address,
          collateral: vault['collateral'].value,
          collateralToken: collateralToken,
          status: vault['status'].value,
          isLiquidated: Number(vault['status'].value) == 201,
          isRedeemed: Number(vault['status'].value) == 202,
          debt: vault['debt'].value
        };
      });

      setState(prevState => ({
        ...prevState,
        vaults: vaults,
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
        <section id="borrow">
          <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
            <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
              Start borrowing
            </h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Borrow against your favorite assets now.
            </p>
          </header>
          <div className="mt-4 space-y-8 sm:space-x-8 sm:flex sm:items-center sm:justify-center sm:space-y-0">
            {loadingVaults ? (
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
              <CollateralCard />
            )}
          </div>
        </section>

        <Prices />
      </main>
    </div>
  );
};
