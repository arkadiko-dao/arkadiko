import React, { useContext } from 'react';
import { Vault, VaultProps } from './vault';
import { AppContext } from '@common/context';

interface VaultGroupProps {
  vaults: VaultProps[];
}

export const VaultGroup: React.FC<VaultGroupProps> = ({ vaults }) => {
  const [{ collateralTypes }, _] = useContext(AppContext);
  const vaultItems = vaults.map((vault: VaultProps) => (
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
  ));
  return (
    <div className="flex flex-col mt-2">
      <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                Vault ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                Collateral Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                Current Collateralization
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                Stability Fee Owed
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                USDA amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                Collateral amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"
              >
                <span className="sr-only">Manage Vault</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{vaultItems}</tbody>
        </table>
      </div>
    </div>
  );
};
