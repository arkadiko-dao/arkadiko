import React from 'react';
import { AuctionProps} from './auction-group';
import { NavLink as RouterLink } from 'react-router-dom'

export const Auction: React.FC<AuctionProps> = ({ id, ustx, price, debt }) => {
  const minimumBidAmount = () => {
    return ((ustx / 1000000) * (price / 100)).toFixed(2);
  }

  return (
    <tr className="bg-white">
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          {id}
        </span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{ustx / 1000000} STX</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${price / 100}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${debt / 1000000}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${minimumBidAmount()}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">TBD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">TBD</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          <RouterLink to={`vaults/${id}`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Bid
          </RouterLink>
        </span>
      </td>
    </tr>
  );
};
