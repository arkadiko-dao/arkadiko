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
      contractName: 'arkadiko-auction-engine-v1-1',
      functionName: 'bid',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-freddie-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
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
        <p className="text-sm text-center text-gray-500">
          Bidding ${(preferredBid + 0.49).toFixed(0)} will close the lot and assign you the
          collateral.
        </p>

        {/* TODO: replace this input with InputAmount component (+ clickMax function) */}
        <div className="relative mt-4 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            $
          </div>
          <input
            type="text"
            name="stx"
            id="stxAmount"
            value={bidAmount}
            onChange={onInputChange}
            className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pl-7 sm:text-sm"
            placeholder="0.00"
            aria-describedby="stx-currency"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 sm:text-sm" id="stx-currency">
              USDA
            </span>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col mt-2">
        <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                  Auction ID
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                  Collateral Auctioned
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                  $/Token
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                  Debt to Raise
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                  Current Bid
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
                  Ends at (block height)
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">{auctionItems}</tbody>
          </table>
        </div>
      </div>
    </>
  );
};
