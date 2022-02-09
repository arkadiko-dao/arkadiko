import React, { useContext, useEffect, useState } from 'react';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { NavLink as RouterLink } from 'react-router-dom';
import { AppContext } from '@common/context';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import {
  AnchorMode,
  uintCV,
  contractPrincipalCV,
  callReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { resolveReserveName } from '@common/vault-utils';
import { tokenTraits } from '@common/vault-utils';
import { useSTXAddress } from '@common/use-stx-address';
export interface VaultProps {
  key: string;
  id: string;
  owner: string;
  collateral: number;
  collateralType: string;
  collateralToken: string;
  stabilityFee: number;
  debt: number;
  isLiquidated: boolean;
  auctionEnded: boolean;
  leftoverCollateral: number;
  collateralData: object;
  stackedTokens: number;
  revokedStacking: boolean;
  showAsTable: boolean;
}

export const debtClass = (liquidationRatio: number, ratio: number) => {
  if (Number(ratio) >= Number(liquidationRatio) + 50) {
    return 'text-green-400';
  } else if (Number(ratio) >= Number(liquidationRatio) + 30) {
    return 'text-orange-400';
  } else if (Number(ratio) > Number(liquidationRatio) + 10) {
    return 'text-red-600';
  }

  return 'text-gray-900 dark:text-zinc-100';
};

export const Vault: React.FC<VaultProps> = ({
  id,
  collateral,
  collateralType,
  collateralToken,
  debt,
  isLiquidated,
  auctionEnded,
  leftoverCollateral,
  collateralData,
  stackedTokens,
  showAsTable = true,
}) => {
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const [stabilityFee, setStabilityFee] = useState(0);
  const [_, setState] = useContext(AppContext);
  const decimals = collateralToken.toLowerCase() === 'stx' ? 1000000 : 100000000;

  useEffect(() => {
    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-stability-fee-for-vault',
        functionArgs: [
          uintCV(id),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v1-1'),
        ],
        senderAddress: contractAddress || '',
        network: network,
      });
      const fee = cvToJSON(feeCall);
      setStabilityFee(fee.value.value);
    };

    if (auctionEnded) {
      setStabilityFee(0);
    } else {
      fetchFees();
    }
  }, []);

  const debtBackgroundClass = (ratio: number) => {
    if (ratio && ratio < Number(collateralData?.liquidationRatio)) {
      return 'bg-red-300';
    }

    return 'bg-white dark:bg-zinc-900';
  };

  let debtRatio = 0;
  if (id) {
    debtRatio = getCollateralToDebtRatio(id)?.collateralToDebt;
  }

  const callWithdrawLeftoverCollateral = async () => {
    const token = tokenTraits[collateralToken.toLowerCase()]['name'];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'withdraw-leftover-collateral',
      functionArgs: [
        uintCV(id),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          resolveReserveName(collateralToken)
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
        ),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished withdraw!', data);
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
    <>
      {showAsTable ? (
        <tr className={`${debtBackgroundClass(debtRatio)}`}>
          <td className="px-6 py-4 text-sm text-left text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            <span className="text-gray-900 dark:text-zinc-100">
              <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5">
                {id}
              </RouterLink>
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-left text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            <span className="text-gray-900 dark:text-zinc-100">{collateralType.toUpperCase()}</span>
          </td>
          <td className="px-6 py-4 text-sm text-left text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            <span className={`${debtClass(collateralData?.liquidationRatio, debtRatio)}`}>
              {debtRatio}% (&gt; {collateralData?.liquidationRatio}%)
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-left text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            <span className="text-gray-900 dark:text-zinc-100">${stabilityFee / 1000000} USDA</span>
          </td>
          <td className="px-6 py-4 text-sm text-left text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            <span className="text-gray-900 dark:text-zinc-100">
              $
              {(debt / 1000000).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              USDA
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-left text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            <span className="text-gray-900 dark:text-zinc-100">
              {(collateral / decimals).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              {collateralToken.toUpperCase()}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-left text-gray-900 dark:text-zinc-100 whitespace-nowrap">
            <span className="text-gray-900 dark:text-zinc-100">
              {isLiquidated ? (
                auctionEnded ? (
                  leftoverCollateral > 0 && stackedTokens === 0 ? (
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => callWithdrawLeftoverCollateral()}
                    >
                      Withdraw Leftover Collateral
                    </button>
                  ) : (
                    <span>Vault liquidated & closed</span>
                  )
                ) : (
                  <span>Auctioning Collateral...</span>
                )
              ) : (
                <RouterLink
                  to={`vaults/${id}`}
                  exact
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                >
                  Manage
                </RouterLink>
              )}
            </span>
          </td>
        </tr>
      ) : (
        <div role="listitem" className="bg-white dark:bg-zinc-900">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sr-only" scope="col">
                  Vaults details
                </th>
                <th className="sr-only" scope="col">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-600">
              <tr>
                <th className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400" scope="row">
                  <div className="flex items-center">Vault ID</div>
                </th>
                <td className="py-5 pr-4">
                  <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">{id}</span>
                </td>
              </tr>

              <tr className="border-t border-gray-200 dark:border-zinc-600">
                <th className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400" scope="row">
                  <div className="flex items-center">Collateral Type</div>
                </th>
                <td className="py-5 pr-4">
                  <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                    {collateralType.toUpperCase()}
                  </span>
                </td>
              </tr>

              <tr className="border-t border-gray-200 dark:border-zinc-600">
                <th className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400" scope="row">
                  Current Collateralization
                </th>
                <td className="py-5 pr-4">
                  <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                    <span className={`${debtClass(collateralData?.liquidationRatio, debtRatio)}`}>
                      {debtRatio}% (&gt; {collateralData?.liquidationRatio}%)
                    </span>
                  </span>
                </td>
              </tr>

              <tr className="border-t border-gray-200 dark:border-zinc-600">
                <th className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400" scope="row">
                  Stability Fee Owed
                </th>
                <td className="py-5 pr-4">
                  <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                    ${stabilityFee / 1000000} USDA
                  </span>
                </td>
              </tr>

              <tr className="border-t border-gray-200 dark:border-zinc-600">
                <th className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400" scope="row">
                  USDA amount
                </th>
                <td className="py-5 pr-4">
                  <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                    $
                    {(debt / 1000000).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}{' '}
                    USDA
                  </span>
                </td>
              </tr>

              <tr className="border-t border-gray-200 dark:border-zinc-600">
                <th className="px-4 py-5 text-sm font-normal text-left text-gray-500 dark:text-zinc-400" scope="row">
                  Collateral amount
                </th>
                <td className="py-5 pr-4">
                  <span className="block text-sm text-right text-gray-700 dark:text-zinc-100">
                    {(collateral / decimals).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}{' '}
                    {collateralToken.toUpperCase()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="px-4 py-5 border-t border-b border-gray-200 dark:border-zinc-600">
            {isLiquidated ? (
              auctionEnded ? (
                leftoverCollateral > 0 && stackedTokens === 0 ? (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => callWithdrawLeftoverCollateral()}
                    >
                      Withdraw Leftover Collateral
                  </button>
                ) : (
                  <span>Vault liquidated</span>
                )
              ) : (
                <span>Auctioning Collateral...</span>
              )
            ) : (
              <RouterLink
                to={`vaults/${id}`}
                exact
                className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Manage Vault
              </RouterLink>
            )}
          </div>
        </div>
      )}
    </>
  );
};
