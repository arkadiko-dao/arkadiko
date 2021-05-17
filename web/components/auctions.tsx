import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Redirect } from 'react-router-dom';
import { Container } from './home'
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, tupleCV, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { AuctionProps, AuctionGroup } from '@components/auction-group';
import { LotGroup } from '@components/lot-group';

export const Auctions: React.FC = () => {
  const { doContractCall } = useConnect();
  const [state, _] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [auctions, setAuctions] = useState([]);
  const [lots, setLots] = useState([]);
  const [redeemableStx, setRedeemableStx] = useState(0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const auctionOpen = async (auctionId) => {
      const auctionOpenCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-auction-engine-v1-1",
        functionName: "get-auction-open",
        functionArgs: [uintCV(auctionId)],
        senderAddress: stxAddress || '',
        network: network,
      });
      const isOpen = cvToJSON(auctionOpenCall);
      return isOpen.value.value;
    };

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const getData = async () => {
      const auctions = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-auction-engine-v1-1",
        functionName: "get-auctions",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(auctions);
      let serializedAuctions:Array<AuctionProps> = [];
      await asyncForEach(json.value.value, async (e: object) => {
        const vault = tupleCV(e);
        const data = vault.data.value;
        const isOpen = await auctionOpen(data['id'].value);
        if (isOpen) {
          serializedAuctions.push({
            id: data['id'].value,
            lotId: data['lots-sold'].value,
            auctionType: data['auction-type'].value,
            collateralToken: data['collateral-token'].value,
            debt: '0',
            endsAt: data['ends-at'].value
          });
        }
      });

      const getLastBid = async (auctionId:number, lotId:number) => {
        const lastBid = await callReadOnlyFunction({
          contractAddress,
          contractName: "arkadiko-auction-engine-v1-1",
          functionName: "get-last-bid",
          functionArgs: [uintCV(auctionId), uintCV(lotId)],
          senderAddress: stxAddress || '',
          network: network,
        });
        const bid = cvToJSON(lastBid).value;
        return bid;
      }

      const lots = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-auction-engine-v1-1",
        functionName: "get-winning-lots",
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const jsonLots = cvToJSON(lots);
      let isAuctionOpen;

      let serializedLots:Array<{ 'lot-id':string, 'auction-id': string, 'collateral-amount': number, 'collateral-token': string, 'xusd': number }> = [];
      await asyncForEach(jsonLots.value.ids.value, async (e: object) => {
        const lot = tupleCV(e);
        const data = lot.data.value;
        if (data['auction-id'].value !== 0) {
          isAuctionOpen = await auctionOpen(data['auction-id'].value);
          const lastBid = await getLastBid(data['auction-id'].value, data['lot-index'].value);

          if (!isAuctionOpen && !lastBid['redeemed'].value) {
            serializedLots.push({
              'lot-id': data['lot-index'].value,
              'auction-id': data['auction-id'].value,
              'collateral-amount': lastBid['collateral-amount'].value,
              'collateral-token': lastBid['collateral-token'].value,
              'xusd': lastBid['xusd'].value
            });
            setLots(serializedLots);
          }
        }
      });

      setAuctions(serializedAuctions);

      const stxRedeemable = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-freddie-v1-1",
        functionName: "get-stx-redeemable",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const jsonStxRedeemable = cvToJSON(stxRedeemable);
      setRedeemableStx(jsonStxRedeemable.value.value);
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  const redeemStx = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'redeem-stx',
      functionArgs: [
        uintCV(state.balance['xstx'])
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished redeeming stx!', data);
        // setTxId(data.txId);
      },
    });
  };

  return (
    <Box>
      {state.userData ? (
        <Container>
          <Box py={6}>
            <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
              <div className="mt-8">

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">Trade xSTX for STX</h2>

                  {state.balance['xstx'] > 0 ? (
                    <p className="mt-2">
                      There are {redeemableStx / 1000000} STX redeemable in the Arkadiko pool. <br/>
                      You have {state.balance['xstx'] / 1000000} xSTX. <br/>

                      <button type="button" onClick={() => redeemStx()} className="mt-2 px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Redeem
                      </button>
                    </p>
                  ) : (
                    <p className="mt-2">You have no xSTX you can trade</p>
                  )}
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">Your Winning Lots</h2>

                  {lots.length > 0 ? (
                    <LotGroup lots={lots} />
                  ) : (
                    <p className="mt-2">You have no winning lots you can redeem. Winning lots can be redeemed when the parent auction closes.</p>
                  )}
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">Auctions</h2>

                  {auctions.length > 0 ? (
                    <AuctionGroup auctions={auctions} />
                  ) : (
                    <p>There are currently no open auctions</p>
                  )}
                </div>

              </div>
            </main>
          </Box>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </Box>  
  );
};
