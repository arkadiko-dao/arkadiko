import React, { useContext, useEffect, useState } from 'react';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { NavLink as RouterLink } from 'react-router-dom';
import { Text } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { uintCV, contractPrincipalCV, callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { resolveReserveName } from '@common/vault-utils';
import { tokenTraits } from '@common/vault-utils';
import { useSTXAddress } from '@common/use-stx-address';

export interface VaultProps {
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
}

export const debtClass = (liquidationRatio: number, ratio: number) => {
  if (ratio >= liquidationRatio + 50) {
    return 'text-green-400';
  } else if (ratio >= liquidationRatio + 30) {
    return 'text-orange-400';
  } else if (ratio > liquidationRatio + 10) {
    return 'text-red-900';
  }

  return 'text-red-900';
};

export const Vault: React.FC<VaultProps> = ({
  id, collateral, collateralType, collateralToken, debt,
  isLiquidated, auctionEnded, leftoverCollateral, collateralData
}) => {
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const [stabilityFee, setStabilityFee] = useState(0);
  const [_, setState] = useContext(AppContext);

  useEffect(() => {
    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-freddie-v1-1",
        functionName: "get-stability-fee-for-vault",
        functionArgs: [
          uintCV(id),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v1-1')
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
    if (ratio && ratio < collateralData.liquidationRatio) {
      return 'bg-red-300';
    }

    return 'bg-white';
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
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', resolveReserveName(collateralToken)),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished withdraw!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  return (
    <tr className={`${debtBackgroundClass(debtRatio)}`}>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5">
            {id}
          </RouterLink>
        </span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{collateralType.toUpperCase()}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className={`${debtClass(collateralData.liquidationRatio, debtRatio)} font-medium`}>{debtRatio}% (&gt; {collateralData['liquidationRatio']}%)</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${stabilityFee / 1000000} xUSD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${(debt / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} xUSD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{(collateral / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {collateralToken.toUpperCase()}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
        <span className="text-gray-900 font-medium">
          {isLiquidated ? auctionEnded ? (leftoverCollateral > 0) ? (
            <Text onClick={() => callWithdrawLeftoverCollateral()}
                  _hover={{ cursor: 'pointer'}}
                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Withdraw Leftover Collateral
            </Text>
          ) : (
            <span>Vault liquidated & closed</span>
          ) : (
            <span>Auctioning Collateral...</span>
          ) : (
            <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage
            </RouterLink>
          )}
        </span>
      </td>
    </tr>
  );
};
