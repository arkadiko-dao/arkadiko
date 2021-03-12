import React from 'react';
import { Auction } from './auction';
import { getStxPrice } from '@common/get-stx-price';

export interface AuctionProps {
  id: string;
  'ustx-amount': string;
}

export const AuctionGroup: React.FC<AuctionProps[]> = ({ auctions }) => {
  const price = parseFloat(getStxPrice().price);
  const auctionItems = auctions.map((auction: object) =>
    <Auction
      key={auction.id}
      id={auction.id}
      ustxAmount={auction['ustx-amount']}
      price={price}
    />
  );
  return (
    <div className="hidden sm:block">
      <div className="flex flex-col mt-2">
        <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auction ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STX Auctioned
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current $ Price/STX
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Minimum Bid
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Bid
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ends at (block height)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auctionItems}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
