import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { tokenTraits } from '@common/vault-utils';
import { VaultProps } from './vault';

interface Props {
  showCloseModal: boolean;
  setShowCloseModal: (arg: boolean) => void;
  vault: VaultProps;
  reserveName: string;
}

export const VaultCloseModal: React.FC<Props> = ({
  match,
  showCloseModal,
  setShowCloseModal,
  vault,
  reserveName,
}) => {
  const [_, setState] = useContext(AppContext);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      open={showCloseModal}
      title="Close Vault"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />}
      closeModal={() => setShowCloseModal(false)}
      buttonText="Close Vault"
      buttonAction={() => closeVault()}
      initialFocus={inputRef}
    >
      <p className="text-sm text-center text-gray-500">
        A vault needs at least 500 USDA. Do you want to close your vault?
      </p>
    </Modal>
  );
};
