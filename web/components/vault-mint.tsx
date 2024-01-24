import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { AnchorMode, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { availableCoinsToMint } from '@common/vault-utils';

interface Props {
  vault: VaultProps;
  reserveName: string;
  price: number;
  collateralType: any;
}

export const VaultMint: React.FC<Props> = ({
  match,
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
          'arkadiko-collateral-types-v3-1'
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v2-2'),
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
    }, resolveProvider() || window.StacksProvider);
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
    const tokens = availableCoinsToMint(
      price * 100,
      collateralLocked(),
      outstandingDebt(),
      collateralType?.collateralToDebtRatio
    ) * 0.98;
    setUsdToMint(
      tokens.toFixed(6)
    );
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setUsdToMint(value);
  };

  return (
    <div>
      <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">Mint extra USDA</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        Choose how much extra USDA you want to mint. You can mint a maximum of{' '}
        <span className="font-semibold">
          {availableCoinsToMint(
            price * 100,
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
            price * 100,
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

      <div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => callMint()}
        >
          Mint
        </button>
      </div>
    </div>
  );
};
