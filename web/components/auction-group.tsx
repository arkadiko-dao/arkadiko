import React, { useContext, useState, useEffect } from 'react';
import { Auction } from './auction';
import { Modal } from '@components/ui/modal';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  makeStandardFungiblePostCondition,
  createAssetInfo,
  FungibleConditionCode,
} from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { AppContext } from '@common/context';
import { useSTXAddress } from '@common/use-stx-address';

export interface AuctionProps {
  id: string;
  lotId: string;
  auctionType: string;
  collateralToken: string;
  debt: string;
  endsAt: string;
  vaultId: string;
}

export const AuctionGroup: React.FC<AuctionProps[]> = ({ auctions, stacksTipHeight }) => {
  const { doContractCall } = useConnect();
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidAuctionId, setBidAuctionId] = useState(0);
  const [bidLotId, setBidLotId] = useState(0);
  const [preferredBid, setPreferredBid] = useState(0);
  const [state, setState] = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  const auctionItems = auctions.map((auction: object) => (
    <Auction
      key={`${auction.id}-${auction['lotId']}`}
      id={auction.id}
      lotId={auction['lotId']}
      auctionType={auction['auctionType']}
      collateralToken={auction['collateralToken']}
      endsAt={auction['endsAt']}
      vaultId={auction['vaultId']}
      stacksTipHeight={stacksTipHeight}
      setShowBidModal={setShowBidModal}
      setBidAuctionId={setBidAuctionId}
      setBidLotId={setBidLotId}
      setPreferredBid={setPreferredBid}
    />
  ));

  const onInputChange = (event: any) => {
    const value = event.target.value;
    setBidAmount(value);
  };

  const addBid = async () => {
    if (!bidAmount) {
      return;
    }
    console.log('Adding with bid amount', bidAmount);

    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(bidAmount * 1000000).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-auction-engine-v3-1',
      functionName: 'bid',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-freddie-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
        uintCV(bidAuctionId),
        uintCV(bidLotId),
        uintCV(bidAmount * 1000000),
      ],
      postConditions,
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished bidding!', data);
        setShowBidModal(false);
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
    <>
      <Modal
        open={showBidModal}
        title="Bid on Auction Lot"
        closeModal={() => setShowBidModal(false)}
        buttonText="Add Bid"
        buttonAction={() => addBid()}
      >
        <p className="text-sm text-center text-gray-500 dark:text-zinc-400">
          Bidding ${(preferredBid + 0.49).toFixed(0)} will close the lot and assign you the
          collateral.
        </p>

        <div className="mt-6">
          {/* TODO: replace this input with InputAmount component (+ clickMax function) */}
          <div className="inline-flex items-center w-full min-w-0 mt-2 mb-2 border border-gray-300 rounded-md focus-within:ring-indigo-500 focus-within:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-500">
            <input
              type="text"
              name="usda"
              id="usdaAmount"
              value={bidAmount}
              onChange={onInputChange}
              className="flex-1 min-w-0 px-3 mr-2 border-0 rounded-md sm:text-sm focus:outline-none focus:ring-0 dark:bg-zinc-700 dark:text-zinc-200"
              placeholder="0.00"
              aria-describedby="usda-currency"
            />
            <div className="ml-auto mr-2 text-sm shrink-0">
              <div className="flex items-center min-w-0">
                <span className="text-gray-400 dark:text-zinc-300 sm:text-sm">USDA</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col mt-2">
        <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
            <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                  Auction ID
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                  Collateral Auctioned
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                  $/Token
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                  Debt to Raise
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                  Current Bid
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400">
                  Ends at (block height)
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"></th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-800 dark:divide-zinc-600">
              {auctionItems}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
