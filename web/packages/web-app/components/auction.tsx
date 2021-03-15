import React, { useEffect, useState } from 'react';
import { AuctionProps} from './auction-group';
import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';

export const Auction: React.FC<AuctionProps> = ({ id, lotId, ustx, price, debt, endsAt, setShowBidModal, setBidAuctionId, setBidLotId, setPreferredBid, setCollateralAmount }) => {
  const [minimumCollateralAmount, setMinimumCollateralAmount] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [acceptedCollateral, setAcceptedCollateral] = useState(0);
  const stxAddress = useSTXAddress();

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const minimumCollateralAmount = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "auction-engine",
        functionName: "calculate-minimum-collateral-amount",
        functionArgs: [uintCV(id)],
        senderAddress: stxAddress || '',
        network: network,
      });

      const collJson = cvToJSON(minimumCollateralAmount);
      setMinimumCollateralAmount(collJson.value.value);

      const currentBid = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "auction-engine",
        functionName: "get-last-bid",
        functionArgs: [uintCV(id), uintCV(lotId)],
        senderAddress: stxAddress || '',
        network: network,
      });

      const json = cvToJSON(currentBid);
      setCurrentBid(json.value.xusd.value);
      setAcceptedCollateral(json.value['collateral-amount'].value);
      setIsClosed(json.value['is-accepted'].value);
    };

    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  const setBidParams = () => {
    setBidAuctionId(id);
    setBidLotId(lotId);
    setPreferredBid(debt / 1000000);
    setShowBidModal(true);
    setCollateralAmount(minimumCollateralAmount);
  };

  const rowBg = () => {
    if (isClosed) {
      return 'bg-green-100';
    }

    return 'bg-white';
  };

  return (
    <tr className={`${rowBg()}`}>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          {id}.{lotId + 1}
        </span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          {isClosed ? (
            <span>{acceptedCollateral / 1000000} STX</span>
            ) : (
            <span>{minimumCollateralAmount / 10000} STX</span>
          )}
        </span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${price / 100}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${(debt / 1000000).toFixed(2)}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${currentBid / 1000000}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{endsAt}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">
          {isClosed ? (
            <p>Bidding Closed</p>
          ) : (
            <button type="button" onClick={() => setBidParams()} className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Bid
            </button>
          )}
        </span>
      </td>
    </tr>
  );
};
