import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { Cl } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { makeContractCall } from '@common/contract-call';
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
  stabilityFee,
  liquidityAvailable,
  setShowLiquidityWarning
}) => {
  const [state, setState] = useContext(AppContext);
  const [usdToMint, setUsdToMint] = useState('');
  const [mintAllowed, setMintAllowed] = useState(true);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const inputRef = useRef<HTMLInputElement>(null);
  const collateralSymbol = match.params.collateral;
  const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];

  const callMint = async () => {
    const tokenAddress = tokenInfo['address'];
    const token = tokenInfo['name'];
    const collateralAmount = vault.collateral;
    const debtAmount = Number(vault.debt) + Number(usdToMint * 1000000);

    const BASE_URL = process.env.HINT_API_URL;
    const totalDebt = debtAmount + Number(stabilityFee);
    const url = BASE_URL + `?owner=${senderAddress}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${totalDebt}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);
    const mintFee = await calculateMintFee(Number(usdToMint) * 1000000);

    const args = [
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-tokens-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-data-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-sorted-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-pool-active-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-vaults-helpers-v1-1'
      ),
      Cl.contractPrincipal(
        process.env.REACT_APP_CONTRACT_ADDRESS || '',
        'arkadiko-oracle-v2-3'
      ),
      Cl.contractPrincipal(tokenAddress, token),
      Cl.uint(collateralAmount),
      Cl.uint(debtAmount),
      Cl.some(Cl.standardPrincipal(hint['prevOwner'])),
      Cl.uint(parseInt(mintFee, 10))
    ];

    const postConditions = [
      {
        type: "ft-postcondition",
        address: senderAddress!,
        condition: "lte",
        amount: parseInt(stabilityFee * 1.3, 10),
        asset: `${contractAddress}.usda-token::usda`,
      },
    ];

    await makeContractCall(
      {
        stxAddress: senderAddress,
        contractAddress,
        contractName: 'arkadiko-vaults-operations-v1-3',
        functionName: 'update-vault',
        functionArgs: args,
        postConditionMode: 'allow',
        network,
      },
      async (error?, txId?) => {
        setState(prevState => ({
          ...prevState,
          currentTxId: txId,
          currentTxStatus: 'pending',
        }));
      }
    );
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

  const availableCoins = (availableCoinsToMint(
    price * 100,
    collateralLocked(),
    outstandingDebt(),
    collateralType?.collateralToDebtRatio
  )).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

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
    if (tokens.toFixed(6) > liquidityAvailable / 1000000) {
      setShowLiquidityWarning(true);
      setMintAllowed(false);
    } else {
      setShowLiquidityWarning(false);
      setMintAllowed(true);
    }
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setUsdToMint(value);
    if (value > liquidityAvailable / 1000000) {
      setShowLiquidityWarning(true);
      setMintAllowed(false);
    } else {
      setShowLiquidityWarning(false);
      setMintAllowed(true);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">Mint extra USDA</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        Choose how much extra USDA you want to mint. You can mint a maximum of{' '}
        <span className="font-semibold">
          {availableCoins}{' '}
          USDA
        </span>.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={availableCoins}
          token="USDA"
          inputName="mintDebt"
          inputId="mintUSDAAmount"
          inputValue={usdToMint}
          inputLabel="Mint USDA"
          onInputChange={onInputChange}
          onClickMax={mintMaxAmount}
          ref={inputRef}
        />
        {Number(usdToMint) > Number(availableCoins) && (
          <span className="mt-2 text-orange-500 mb-2">You cannot mint more than {availableCoins} USDA</span>
        )}
      </div>

      <div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => callMint()}
          disabled={!mintAllowed || Number(usdToMint) > Number(availableCoins)}
        >
          Mint
        </button>
      </div>
    </div>
  );
};
