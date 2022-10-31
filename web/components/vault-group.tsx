import React, { useContext } from 'react';
import { Vault, VaultProps } from './vault';
import { AppContext } from '@common/context';
interface VaultGroupProps {
  vaults: VaultProps[];
}

export const VaultGroup: React.FC<VaultGroupProps> = ({ vaults }) => {
  const [{ collateralTypes }, _] = useContext(AppContext);
  const vaultItems = vaults.map((vault: VaultProps) => (
    <Vault {...vault} collateralData={collateralTypes[vault.collateralType]} />
  ));

  return (
    <>
      <div className="grid grid-cols-1 gap-8 mt-4 sm:grid-cols-2">
        {vaultItems}
      </div>
    </>
  );
};
