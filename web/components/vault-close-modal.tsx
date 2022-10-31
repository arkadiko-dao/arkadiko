import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
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
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const closeVault = async () => {
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    const tokenAddress = tokenTraits[vault['collateralToken'].toLowerCase()]['address'];
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'close-vault',
      postConditionMode: 0x01,
      functionArgs: [
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(tokenAddress, token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
      ],
      onFinish: data => {
        console.log('finished closing vault!', data, data.txId);
        setShowCloseModal(false);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

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
        Are you sure you want to close your vault? This change is irreversible and any yield you are
        waiting for won't be received.
      </p>
    </Modal>
  );
};
