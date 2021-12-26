import React, { useEffect, useState } from 'react';
import { AuctionProps } from './auction-group';
import { callReadOnlyFunction, contractPrincipalCV, cvToJSON, uintCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { getPrice } from '@common/get-price';

export const Auction: React.FC<AuctionProps> = ({
  id,
  lotId,
  collateralToken,
  endsAt,
  stacksTipHeight,
  setShowBidModal,
  setBidAuctionId,
  setBidLotId,
  setPreferredBid,
}) => {
  const [minimumCollateralAmount, setMinimumCollateralAmount] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [debtToRaise, setDebtToRaise] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0.0);
  const [price, setPrice] = useState(0.0);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getPrice(collateralToken);
      setPrice(price);

      const discountedPriceCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-auction-engine-v2-1',
        functionName: 'discounted-auction-price',
        functionArgs: [uintCV(price), uintCV(id)],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(discountedPriceCall);
      setDiscountedPrice(json.value.value);
    };

    fetchPrice();
  }, []);

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const minimumCollateralAmount = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-auction-engine-v2-1',
        functionName: 'get-minimum-collateral-amount',
        functionArgs: [
          contractPrincipalCV(contractAddress || '', 'arkadiko-oracle-v1-1'),
          uintCV(id),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });

      const collJson = cvToJSON(minimumCollateralAmount);
      setMinimumCollateralAmount(collJson.value.value);
      const debtMax = 1000000000;
      setDebtToRaise(Math.min(debtMax, (collJson.value.value * discountedPrice) / 100));

      const currentBid = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-auction-engine-v2-1',
        functionName: 'get-last-bid',
        functionArgs: [uintCV(id), uintCV(lotId)],
        senderAddress: stxAddress || '',
        network: network,
      });

      const json = cvToJSON(currentBid);
      if (json.value.usda.value > 0) {
        setCurrentBid(json.value.usda.value);
        setMinimumCollateralAmount(json.value['collateral-amount'].value);
        setDebtToRaise(
          Math.min(debtMax, (json.value['collateral-amount'].value * discountedPrice) / 100)
        );
      }
    };

    if (mounted && price !== 0 && discountedPrice !== 0) {
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, [price, discountedPrice]);

  const setBidParams = () => {
    setBidAuctionId(id);
    setBidLotId(lotId);
    setPreferredBid(debtToRaise / 1000000);
    setShowBidModal(true);
  };

  return (
    <tr className="bg-white dark:bg-zinc-900">
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {id}.{lotId + 1}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          <span>
            {minimumCollateralAmount / 1000000} {collateralToken.toUpperCase()}
          </span>
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">${(discountedPrice / 100).toFixed(2)}</span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">${(debtToRaise / 1000000).toFixed(4)}</span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">${currentBid / 1000000}</span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {endsAt} (~{(((Number(endsAt) - stacksTipHeight) * 10) / 60).toFixed(2)} hours)
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          <button
            type="button"
            onClick={() => setBidParams()}
            className="mr-2 px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Bid
          </button>
        </span>
      </td>
    </tr>
  );
};
