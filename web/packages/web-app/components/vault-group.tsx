import React from 'react';
import { Vault } from './vault';
import { getVaults } from '@common/get-vaults';

export const VaultGroup: React.FC = () => {
  const vaults = getVaults();

  const vaultItems = vaults.vaults.map((vault) =>
    <Vault
      key={vault.id.value}
      id={vault.id.value}
      address={vault.address.value}
      stxCollateral={vault['stx-collateral'].value}
      coinsMinted={vault['coins-minted'].value}
      atBlockHeight={vault['at-block-height'].value}
    />
  );
  return (
    <div className="hidden sm:block">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mt-2">
          <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vault ID
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stability Fee
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liq. Ratio
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Collateralization
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    xUSD amount
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STX amount
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vaultItems}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
