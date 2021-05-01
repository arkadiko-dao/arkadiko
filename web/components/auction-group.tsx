import React, { useContext, useState } from 'react';
import { Auction } from './auction';
import { Modal } from '@blockstack/ui';
import { contractPrincipalCV, uintCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { AppContext } from '@common/context';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { TxStatus } from '@components/tx-status';

export interface AuctionProps {
  id: string;
  lotId: string;
  auctionType: string;
  collateralToken: string;
  debt: string;
  endsAt: string;
}

export const AuctionGroup: React.FC<AuctionProps[]> = ({ auctions }) => {
  const { doContractCall } = useConnect();
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidAuctionId, setBidAuctionId] = useState(0);
  const [bidLotId, setBidLotId] = useState(0);
  const [preferredBid, setPreferredBid] = useState(0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [state, setState] = useContext(AppContext);
  websocketTxUpdater();

  const auctionItems = auctions.map((auction: object) =>
    <Auction
      key={`${auction.id}-${auction['lotId']}`}
      id={auction.id}
      lotId={auction['lotId']}
      auctionType={auction['auctionType']}
      collateralToken={auction['collateralToken']}
      endsAt={auction['endsAt']}
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
      contractName: 'auction-engine',
      functionName: 'bid',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'freddie'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'oracle'),
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
      <TxStatus />

      <Modal isOpen={showBidModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Bid on Auction Lot
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Bidding ${preferredBid.toFixed(4)} will close the lot and assign you the collateral.
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      $
                    </div>
                    <input type="text" name="stx" id="stxAmount"
                          value={bidAmount}
                          onChange={onInputChange}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00" aria-describedby="stx-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stx-currency">
                        xUSD
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => addBid()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Add bid
              </button>

              <button type="button" onClick={() => setShowBidModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col mt-2">
        <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auction ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collateral Auctioned
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  $/Token
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt to Raise
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
