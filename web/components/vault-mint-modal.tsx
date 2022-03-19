import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { availableCoinsToMint } from '@common/vault-utils';

interface Props {
  showMintModal: boolean;
  setShowMintModal: (arg: boolean) => void;
  vault: VaultProps;
  reserveName: string;
  price: number;
  collateralType: any;
}

export const VaultMintModal: React.FC<Props> = ({
  match,
  showMintModal,
  setShowMintModal,
  vault,
  reserveName,
  price,
  collateralType,
}) => {
  const [_, setState] = useContext(AppContext);
  const [usdToMint, setUsdToMint] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const callMint = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'mint',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseInt(parseFloat(usdToMint).toFixed(6) * 1000000, 10)),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
      ],
      onFinish: data => {
        console.log('finished mint!', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowMintModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const collateralLocked = () => {
    if (vault) {
      const decimals = vault['collateralType'].toLowerCase().includes('stx') ? 1000000 : 100000000;
      return vault['collateral'] / decimals;
    }

    return 0;
  };

  const outstandingDebt = () => {
    if (vault) {
      return vault.debt / 1000000;
    }

    return 0;
  };

  const mintMaxAmount = () => {
    setUsdToMint(
      availableCoinsToMint(
        price,
        collateralLocked(),
        outstandingDebt(),
        collateralType?.collateralToDebtRatio
      ) * 0.98
    );
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setUsdToMint(value);
  };

  return (
    <Modal
      open={showMintModal}
      title="Mint extra USDA"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />}
      closeModal={() => setShowMintModal(false)}
      buttonText="Mint"
      buttonAction={() => callMint()}
      initialFocus={inputRef}
    >
      <p className="text-sm text-center text-gray-500 dark:text-zinc-400">
        Choose how much extra USDA you want to mint. You can mint a maximum of{' '}
        <span className="font-semibold">
          {availableCoinsToMint(
            price,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}{' '}
          USDA
        </span>
        .
      </p>

      <div className="mt-6">
        <InputAmount
          balance={availableCoinsToMint(
            price,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="USDA"
          inputName="mintDebt"
          inputId="mintUSDAAmount"
          inputValue={usdToMint}
          inputLabel="Mint USDA"
          onInputChange={onInputChange}
          onClickMax={mintMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
