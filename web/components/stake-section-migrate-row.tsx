import React, { useContext } from 'react';
import { tokenList } from '@components/token-swap-list';
import { StyledIcon } from './ui/styled-icon';
import { useSTXAddress } from '@common/use-stx-address';
import { AnchorMode } from '@stacks/transactions';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import { AppContext } from '@common/context';

export interface StakeSectionMigrateRowProps {
  tokenName: string,
  tokenX: number,
  tokenY: number,
  amount: number,
  functionName: string,
}

export const StakeSectionMigrateRow: React.FC<StakeSectionMigrateRowProps> = ({ 
  tokenName,
  tokenX,
  tokenY,
  amount,
  functionName
}) => {
  const [, setState] = useContext(AppContext);

  const stxAddress = useSTXAddress() || '';
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  
  async function migrate() {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-pool-migrate-v1-1',
      functionName: functionName,
      functionArgs: [],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  }

  return (
    <tbody key={tokenX + "-" + tokenY} className="bg-white dark:bg-zinc-800">
      <tr className="bg-white dark:bg-zinc-800">

        {/* TOKEN */}
        <td className="px-6 py-4 text-sm whitespace-nowrap">
          <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
            <div className="flex -space-x-2 shrink-0">
              <img
                className="inline-block w-8 h-8 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                src={tokenList[tokenX].logo}
                alt=""
              />
              {tokenX != tokenY ? (
                <img
                  className="inline-block w-8 h-8 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-800"
                  src={tokenList[tokenY].logo}
                  alt=""
                />
              ):null}
            </div>
            <p className="mt-2 sm:mt-0 sm:ml-4">
              <span className="block text-gray-500 dark:text-zinc-400">
                {tokenName}
              </span>
            </p>
          </div>
        </td>

        {/* AMOUNT */}
        <td className="px-6 py-4 whitespace-nowrap">
          <p className="font-semibold">
            {amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}{' '}
            <span className="text-sm font-normal">{tokenName}</span>
          </p>
        </td>

        {/* ACTION */}
        <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => migrate()}
          >
            <div className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
              <span>Migrate</span>
              <StyledIcon
                as="ChevronDoubleRightIcon"
                size={4}
                className="ml-2"
              />
            </div>
          </button>
        </td>

      </tr>
    </tbody>
  );
};
