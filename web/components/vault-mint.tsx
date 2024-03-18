import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { AnchorMode, contractPrincipalCV, uintCV, someCV, standardPrincipalCV, makeStandardFungiblePostCondition, createAssetInfo, FungibleConditionCode } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { availableCoinsToMint, tokenTraits, calculateMintFee } from '@common/vault-utils';

interface Props {
  vault: VaultProps;
  reserveName: string;
  price: number;
  collateralType: any;
  stabilityFee: number;
}

export const VaultMint: React.FC<Props> = ({
  match,
  vault,
  reserveName,
  price,
  collateralType,
  stabilityFee
}) => {
  const [_, setState] = useContext(AppContext);
  const [usdToMint, setUsdToMint] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);
  const collateralSymbol = match.params.collateral;
  const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];

  const callMint = async () => {
    const tokenAddress = tokenInfo['address'];
    const token = tokenInfo['name'];
    const collateralAmount = vault.collateral;
    const debtAmount = Number(vault.debt) + Number(usdToMint * 1000000);

    const BASE_URL = process.env.HINT_API_URL;
    const url = BASE_URL + `?owner=${senderAddress}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${debtAmount}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);
    const mintFee = await calculateMintFee(Number(usdToMint) * 1000000);

    const args = [
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-tokens-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-data-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-sorted-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-pool-active-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-helpers-v1-1'
      ),
      contractPrincipalCV(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-oracle-v2-3'
      ),
      contractPrincipalCV(tokenAddress, token),
      uintCV(collateralAmount),
      uintCV(debtAmount),
      someCV(standardPrincipalCV(hint['prevOwner'])),
      uintCV(parseInt(mintFee, 10))
    ];

    const postConditions = [
      makeStandardFungiblePostCondition(
        senderAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(parseInt(stabilityFee * 1.3, 10)).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-vaults-operations-v1-1',
      functionName: 'update-vault',
      functionArgs: args,
      postConditions,
      onFinish: data => {
        console.log('finished mint!', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
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
    );
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
          {(availableCoinsToMint(
            price * 100,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio
          )).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}{' '}
          USDA
        </span>
        . Minting will include a stability fee of maximum <span className="font-semibold">{(stabilityFee / 1000000).toFixed(6)} USDA</span>.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={(availableCoinsToMint(
            price * 100,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio
          )).toLocaleString(undefined, {
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
