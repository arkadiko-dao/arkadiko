import React from 'react';
import { Vault } from './vault';
import { getVaults } from '@common/get-vaults';
import { Flex } from '@blockstack/ui';

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
    <Flex>
      <ul>
        {vaultItems}
      </ul>
    </Flex>
  );
};
