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
import { tokenList } from './token-swap-list';
import { StyledIcon } from './ui/styled-icon';
import { Status } from './ui/health-status';

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
  liquidationRatio: number;
}

export const debtClass = (liquidationRatio: number, ratio: number) => {
  if (Number(ratio) >= Number(liquidationRatio) + 50) {
    return 'text-green-500';
  } else if (Number(ratio) >= Number(liquidationRatio) + 30) {
    return 'text-orange-500';
  } else if (Number(ratio) > Number(liquidationRatio) + 10) {
    return 'text-red-600';
  }

  return 'text-gray-900 dark:text-zinc-100';
};

export const Vault: React.FC<VaultProps> = ({
  owner,
  collateral,
  collateralToken,
  status,
  debt,
  isLiquidated,
  liquidationRatio
}) => {
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const [stabilityFee, setStabilityFee] = useState(0);
  const [_, setState] = useContext(AppContext);
  const decimals = (collateralToken.toLowerCase() === 'stx' || collateralToken.toLocaleLowerCase() === 'xstx') ? 1000000 : 100000000;
  const collateralListInfo = tokenList.find(token => token['name'] === collateralToken);

  useEffect(() => {
    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-stability-fee-for-vault',
        functionArgs: [
          uintCV(id),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v3-1'),
        ],
        senderAddress: contractAddress || '',
        network: network,
      });
      const fee = cvToJSON(feeCall);
      setStabilityFee(fee.value.value);
    };

    // TODO:
    // fetchFees();
  }, []);

  let debtRatio = 180;
  // TODO
  // if (id) {
  //   debtRatio = getCollateralToDebtRatio(id)?.collateralToDebt;
  // }

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
          'arkadiko-collateral-types-v3-1'
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

  const positionData = [
    {
      label: `${collateralToken} amount`,
      amount: (collateral / decimals).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }),
      unit: collateralToken.toUpperCase()
    },
    {
      label: 'Debt',
      amount: (debt / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
      unit: 'USDA'
    },
    {
      label: 'Health',
      amount: debtRatio,
      unit: '%'
    }
  ]

  return (
    <>
      <div className={`relative border rounded-md shadom-sm ${debtRatio != 0 ? (debtRatio < Number(liquidationRatio) ? 'bg-red-50/30 border-red-600/60' : 'bg-white dark:bg-zinc-800 border-gray-200/80 dark:border-zinc-800') : 'bg-white dark:bg-zinc-800 border-gray-200/80 dark:border-zinc-800'}`}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img className="w-8 h-8 mr-3 rounded-full shrink-0" src={collateralListInfo?.logo} alt="" />
              <h2 className="text-xl font-medium font-semibold leading-6 text-gray-700 dark:text-zinc-100">
                {collateralToken}
              </h2>
            </div>
            <>
              {Number(status) === 101 && debtRatio != 0 ? (
                debtClass(liquidationRatio, debtRatio) == 'text-green-500' ? (
                  <Status
                    type={Status.type.SUCCESS }
                    label='Healthy'
                    labelHover='Low liquidation risk'
                  />
                ) : debtClass(liquidationRatio, debtRatio) == 'text-orange-500' ? (
                  <Status
                    type={Status.type.WARNING}
                    label='Warning'
                    labelHover='Medium liquidation risk'
                  />
                ) : (
                  <Status
                    type={Status.type.ERROR}
                    label='Danger'
                    labelHover='High liquidation risk'
                  />
                )
              ) : null}
            </>
          </div>
        </div>
        <div className="p-6">
          <dl className="space-y-2">
            {positionData.map(item => (
              <div key={item.label}>
                <dt className="text-sm leading-6 text-gray-500 dark:text-zinc-400">
                  {item.label}
                </dt>
                <dd className="text-lg font-semibold dark:text-white">
                  {item.label === "Health" ? (
                    <span className={`${debtClass(liquidationRatio, debtRatio)}`}>
                      {item.amount}{item.unit} <span className="text-sm">(&gt; {liquidationRatio}%)</span>
                    </span>
                  )
                  :
                    <>
                      {item.amount}{' '}
                      <span className="text-sm">{item.unit}</span>
                    </>
                  }
                </dd>
              </div>
            ))}
          </dl>

          <div className="text-right">
            {isLiquidated ? (
              auctionEnded ? (
                leftoverCollateral > 0 && stackedTokens === 0 ? (
                  <button
                    type="button"
                    className="inline-flex px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                to={`vaults/${stxAddress}/${collateralToken}`}
                exact
                className="inline-flex items-center px-2 text-sm font-medium text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 hover:text-indigo-700"
              >
                <span className="absolute inset-0" aria-hidden="true"></span>
                {parseInt(status, 10) === 101 ? 'Manage' : 'Open Vault'}
                <StyledIcon as="ArrowRightIcon" size={5} className="ml-2 -rotate-45" />
              </RouterLink>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
