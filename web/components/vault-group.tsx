import React, { useContext } from 'react';
import { Vault, VaultProps } from './vault';
import { AppContext } from '@common/context';

interface VaultGroupProps {
  vaults: VaultProps[];
}

export const VaultGroup: React.FC<VaultGroupProps> = ({ vaults }) => {
  const { collateralTypes } = useContext(AppContext);
  const vaultItems = vaults.map((vault: VaultProps) =>
    <Vault
      key={vault.id}
      id={vault.id}
      owner={vault['owner']}
      collateral={vault['collateral']}
      collateralType={vault['collateralType']}
      collateralToken={vault['collateralToken']}
      stabilityFee={vault['stabilityFee']}
      debt={vault['debt']}
      isLiquidated={vault['isLiquidated']}
      auctionEnded={vault['auctionEnded']}
      leftoverCollateral={vault['leftoverCollateral']}
      collateralData={collateralTypes[vault['collateralType']]}
    />
  );
  return (
    <div className="hidden sm:block">
      <div className="flex flex-col mt-2">
        <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vault ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collateral Type
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Collateralization
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stability Fee Owed
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  xUSD amount
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collateral amount
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
  );
};
