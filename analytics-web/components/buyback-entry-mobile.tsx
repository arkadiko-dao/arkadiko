import React from 'react';
import { tokenList } from '../../web/components/token-swap-list';

export const BuyBackEntryMobile: React.FC = ({ txid, date, burned, cumulative, supply }) => {
  return (
    <section className="py-2">
      <table className="w-full">
        <thead>
          <tr>
            <th className="sr-only" scope="col">
              Data Type
            </th>
            <th className="sr-only" scope="col">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
              scope="row"
            >
              <div className="flex items-center">Time</div>
            </th>
            <td className="pt-3 pb-2 pr-4 text-gray-700">
              <a
                href={`https://explorer.hiro.so/txid/${txid}?chain=mainnet`}
                target="_blank"
                className="text-right text-indigo-500 underline"
              >
                {date}
              </a>
            </td>
          </tr>
          <tr>
            <th
              className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
              scope="row"
            >
              <div className="flex items-center">DIKO Burnt</div>
            </th>
            <td className="pt-3 pb-2 pr-4 text-gray-700">
              {burned}{' '}
              <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
            </td>
          </tr>
          <tr>
            <th
              className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
              scope="row"
            >
              <div className="flex items-center">Cumulative DIKO Burnt</div>
            </th>
            <td className="pt-3 pb-2 pr-4 text-gray-700">
              {cumulative}{' '}
              <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
            </td>
          </tr>
          <tr>
            <th
              className="px-4 pt-3 pb-2 text-sm font-normal text-left text-gray-500 dark:text-zinc-400"
              scope="row"
            >
              <div className="flex items-center">Total Supply</div>
            </th>
            <td className="pt-3 pb-2 pr-4 text-gray-700">
              {supply}{' '}
              <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
