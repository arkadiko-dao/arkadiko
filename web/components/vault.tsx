import React, { useContext, useEffect, useState } from 'react';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { NavLink as RouterLink } from 'react-router-dom';
import { Text } from '@blockstack/ui';
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
  if (Number(ratio) >= Number(liquidationRatio) + 50) {
    return 'text-green-400';
  } else if (Number(ratio) >= Number(liquidationRatio) + 30) {
    return 'text-orange-400';
  } else if (Number(ratio) > Number(liquidationRatio) + 10) {
    return 'text-red-900';
  }

  return 'text-red-900';
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
    <tr className={`${debtBackgroundClass(debtRatio)}`}>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="text-gray-900">
          <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5">
            {id}
          </RouterLink>
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="text-gray-900">{collateralType.toUpperCase()}</span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className={`${debtClass(collateralData?.liquidationRatio, debtRatio)}`}>
          {debtRatio}% (&gt; {collateralData['liquidationRatio']}%)
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="text-gray-900">${stabilityFee / 1000000} USDA</span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="text-gray-900">
          $
          {(debt / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}{' '}
          USDA
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="text-gray-900">
          {(collateral / decimals).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}{' '}
          {collateralToken.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-900 whitespace-nowrap">
        <span className="text-gray-900">
          {isLiquidated ? (
            auctionEnded ? (
              leftoverCollateral > 0 ? (
                <Text
                  onClick={() => callWithdrawLeftoverCollateral()}
                  _hover={{ cursor: 'pointer' }}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Withdraw Leftover Collateral
                </Text>
              ) : (
                <span>Vault liquidated & closed</span>
              )
            ) : (
              <span>Auctioning Collateral...</span>
            )
          ) : (
            <RouterLink to={`vaults/${id}`} exact className="text-indigo-600 hover:text-indigo-900">
              Manage
            </RouterLink>
          )}
        </span>
      </td>
    </tr>
  );
};
