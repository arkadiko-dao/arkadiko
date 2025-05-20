import React from 'react';
import { tokenList } from '../../web/components/token-swap-list';

export const BuyBackEntry: React.FC = ({ txid, date, burned, cumulative, supply }) => {
  return (
    <tr className="bg-white">
      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
        <a
          href={`https://explorer.hiro.so/txid/${txid}?chain=mainnet`}
          target="_blank"
          className="text-indigo-500 underline"
        >
          {date}
        </a>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {burned}{' '}
        <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {cumulative}{' '}
        <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {supply}{' '}
        <img className="w-4 h-4 inline ml-1.5" src={tokenList[1].logo} alt="" />
      </td>
    </tr>
  )
}
