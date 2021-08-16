import React, { useContext, useState, useEffect } from 'react';
import { Auction } from './auction';
import { Modal } from '@blockstack/ui';
import { contractPrincipalCV, uintCV } from '@stacks/transactions';
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
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();
  const [state, setState] = useContext(AppContext);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  const auctionItems = auctions.map((auction: object) =>
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
  );

  const onInputChange = (event:any) => {
    const value = event.target.value;
    setBidAmount(value);
  };

  const addBid = async () => {
    if (!bidAmount) {
      return;
    }
    console.log('Adding with bid amount', bidAmount);

    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-auction-engine-v1-1',
      functionName: 'bid',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-freddie-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1'),
        uintCV(bidAuctionId),
        uintCV(bidLotId),
        uintCV(bidAmount * 1000000)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished bidding!', data);
        setShowBidModal(false);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  return (
    <div className="hidden sm:block">
      <Modal isOpen={showBidModal}>
        <div className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block px-2 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
                  Bid on Auction Lot
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bidding ${preferredBid.toFixed(4)} will close the lot and assign you the collateral.
                  </p>

                  <div className="relative mt-4 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      $
                    </div>
                    <input type="text" name="stx" id="stxAmount"
                          value={bidAmount}
                          onChange={onInputChange}
                          className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pl-7 sm:text-sm"
                          placeholder="0.00" aria-describedby="stx-currency" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stx-currency">
                        USDA
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => addBid()} className="inline-flex justify-center w-full px-4 py-2 mb-5 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Add bid
              </button>

              <button type="button" onClick={() => setShowBidModal(false)} className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
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
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-gray-50">
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
