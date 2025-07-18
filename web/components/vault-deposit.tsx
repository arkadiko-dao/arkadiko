import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { Alert } from './ui/alert';
import {
  Cl
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { makeContractCall } from '@common/contract-call';
import BN from 'bn.js';
import { VaultProps } from './vault';
import { tokenTraits, tokenNameToTicker } from '@common/vault-utils';

interface Props {
  vault: VaultProps;
  reserveName: string;
  decimals: number;
  stabilityFee: number;
}

export const VaultDeposit: React.FC<Props> = ({
  match,
  vault,
  reserveName,
  decimals,
  stabilityFee,
  setShowBurnWarning
}) => {
  const [state, setState] = useContext(AppContext);
  const [extraCollateralDeposit, setExtraCollateralDeposit] = useState('');
  const [depositAllowed, setDepositAllowed] = useState(true);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';
  const stStxContractAddress = process.env.STSTX_CONTRACT_ADDRESS || '';
  const sbtcContractAddress = process.env.SBTC_CONTRACT_ADDRESS || '';

  const senderAddress = useSTXAddress();
  const inputRef = useRef<HTMLInputElement>(null);
  const collateralSymbol = match.params.collateral;
  const tokenInfo = tokenTraits[collateralSymbol.toLowerCase()];

  const addDeposit = async () => {
    if (!extraCollateralDeposit) {
      return;
    }
    const tokenAddress = tokenInfo['address'];
    const token = tokenInfo['name'];
    const decimals = token === 'Wrapped-Bitcoin' || token === 'sbtc-token' || token === 'auto-alex' ? 100000000 : 1000000;
    const collateralAmount = Number(vault.collateral) + Number(parseFloat(extraCollateralDeposit) * decimals);
    const debtAmount = Number(vault.debt);

    let postConditions: any[] = [];
    // if (vault['collateralToken'].toLowerCase() === 'stx') {
    //   postConditions = [
    //     makeStandardSTXPostCondition(
    //       senderAddress || '',
    //       FungibleConditionCode.Equal,
    //       new BN(parseFloat(extraCollateralDeposit) * decimals)
    //     ),
    //   ];
    // } else if (vault['collateralToken'].toLowerCase() === 'xbtc') {
    //   postConditions = [
    //     makeStandardFungiblePostCondition(
    //       senderAddress || '',
    //       FungibleConditionCode.LessEqual,
    //       new BN(parseFloat(extraCollateralDeposit) * decimals),
    //       createAssetInfo(
    //         xbtcContractAddress,
    //         'Wrapped-Bitcoin',
    //         'wrapped-bitcoin'
    //       )
    //     ),
    //   ];
    // } else if (vault['collateralToken'].toLowerCase() === 'ststx') {
    //   postConditions = [
    //     makeStandardFungiblePostCondition(
    //       senderAddress || '',
    //       FungibleConditionCode.LessEqual,
    //       new BN(parseFloat(extraCollateralDeposit) * decimals),
    //       createAssetInfo(
    //         stStxContractAddress,
    //         'ststx-token',
    //         'ststx'
    //       )
    //     ),
    //   ];
    // } else if (vault['collateralToken'].toLowerCase() === 'sbtc') {
    //   postConditions = [
    //     makeStandardFungiblePostCondition(
    //       senderAddress || '',
    //       FungibleConditionCode.LessEqual,
    //       new BN(parseFloat(extraCollateralDeposit) * decimals),
    //       createAssetInfo(
    //         sbtcContractAddress,
    //         'sbtc-token',
    //         'sbtc-token'
    //       )
    //     ),
    //   ];
    // }  else {
    //   postConditions = [
    //     makeStandardFungiblePostCondition(
    //       senderAddress || '',
    //       FungibleConditionCode.LessEqual,
    //       new BN(parseFloat(extraCollateralDeposit) * decimals),
    //       createAssetInfo(
    //         atAlexContractAddress,
    //         'auto-alex',
    //         'auto-alex'
    //       )
    //     ),
    //   ];
    // }
    // postConditions.push(
    //   makeStandardFungiblePostCondition(
    //     senderAddress || '',
    //     FungibleConditionCode.LessEqual,
    //     uintCV(parseInt(stabilityFee * 1.3, 10)).value,
    //     createAssetInfo(contractAddress, 'usda-token', 'usda')
    //   )
    // );

    const BASE_URL = process.env.HINT_API_URL;
    const totalDebt = debtAmount + Number(stabilityFee);
    const url = BASE_URL + `?owner=${senderAddress}&token=${tokenAddress}.${token}&collateral=${collateralAmount}&debt=${totalDebt}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);

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
      Cl.uint(100)
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

  const depositMaxAmount = () => {
    const token = vault['collateralToken'].toLowerCase();
    const decimals = token === 'xbtc' || token === 'sbtc' || token === 'auto-alex' ? 100000000 : 1000000;
    if (token === 'stx') {
      setExtraCollateralDeposit((state.balance['stx'] / decimals - 1).toString());
    } else {
      setExtraCollateralDeposit((state.balance[token] / decimals).toString());
    }

    const debtAmount = Number(vault.debt);
    if (debtAmount < 500 * 1000000) {
      setShowBurnWarning(true);
      setDepositAllowed(false);
    } else {
      setShowBurnWarning(false);
      setDepositAllowed(true);
    }
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setExtraCollateralDeposit(value);

    const debtAmount = Number(vault.debt);
    if (debtAmount < 500 * 1000000) {
      setShowBurnWarning(true);
      setDepositAllowed(false);
    } else {
      setShowBurnWarning(false);
      setDepositAllowed(true);
    }
  };

  return (
    <div>
      <h3 className="text-base font-normal leading-6 text-gray-900 font-headings dark:text-zinc-50">Deposit extra collateral</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        You have a balance of{' '}
        <span className="font-semibold">
          {state.balance[vault?.collateralToken.toLowerCase()] / decimals}{' '}
          {tokenNameToTicker(vault?.collateralToken || '')}
        </span>
        . Depositing extra collateral allows you to mint more USDA.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={(state.balance[vault?.collateralToken.toLowerCase()] / decimals).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            }
          )}
          token={tokenNameToTicker(vault?.collateralToken || '')}
          inputName="depositCollateral"
          inputId="depositExtraStxAmount"
          inputValue={extraCollateralDeposit}
          inputLabel="Deposit Extra Collateral"
          onInputChange={onInputChange}
          onClickMax={depositMaxAmount}
          ref={inputRef}
        />
      </div>

      <div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => addDeposit()}
          disabled={!depositAllowed}
        >
          Deposit
        </button>
      </div>
    </div>
  );
};
