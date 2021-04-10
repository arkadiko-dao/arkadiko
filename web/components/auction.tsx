import React, { useEffect, useState } from 'react';
import { AuctionProps} from './auction-group';
import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { getPrice } from '@common/get-price';

export const Auction: React.FC<AuctionProps> = ({ id, lotId, collateralToken, debt, endsAt, setShowBidModal, setBidAuctionId, setBidLotId, setPreferredBid, setCollateralAmount }) => {
  const [minimumCollateralAmount, setMinimumCollateralAmount] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [acceptedCollateral, setAcceptedCollateral] = useState(0);
  const [debtToRaise, setDebtToRaise] = useState(debt);
  const [price, setPrice] = useState(0.0);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    const fetchPrice = async () => {
      let price = await getPrice(collateralToken.toLowerCase());
      setPrice(price - (price * 0.03)); // TODO: change for discounted-auction-price on auction-engine SC
    };

    fetchPrice();
  }, []);

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const minimumCollateralAmount = await callReadOnlyFunction({
        contractAddress,
        contractName: "auction-engine",
        functionName: "calculate-minimum-collateral-amount",
        functionArgs: [uintCV(id)],
        senderAddress: stxAddress || '',
        network: network,
      });

      const collJson = cvToJSON(minimumCollateralAmount);
      setMinimumCollateralAmount(collJson.value.value);
      // const debtNeeded = collJson.value.value * (price / 100);
      // if (debtToRaise > debtNeeded) {
      //   setDebtToRaise(debtNeeded);
      // }

      const currentBid = await callReadOnlyFunction({
        contractAddress,
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
  }, [price]);

  const setBidParams = () => {
    setBidAuctionId(id);
    setBidLotId(lotId);
    setPreferredBid(debtToRaise / 1000000);
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
            <span>{acceptedCollateral / 1000000} {collateralToken.toUpperCase()}</span>
            ) : (
            <span>{minimumCollateralAmount / 1000000} {collateralToken.toUpperCase()}</span>
          )}
        </span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${(price / 100).toFixed(2)}</span>
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        <span className="text-gray-900 font-medium">${(debt / 1000000).toFixed(4)}</span>
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
