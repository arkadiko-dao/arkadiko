import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Redirect } from 'react-router-dom';
import { Container } from './home'
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON, tupleCV, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { AuctionGroup } from '@components/auction-group';
import { LotGroup } from '@components/lot-group';

export const Auctions: React.FC = () => {
  const state = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [auctions, setAuctions] = useState([]);
  const [lots, setLots] = useState([]);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const auctions = await callReadOnlyFunction({
        contractAddress,
        contractName: "auction-engine",
        functionName: "get-auctions",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(auctions);
      let serializedAuctions:Array<{ id: string, 'lot-id':string, 'collateral-amount': string, 'debt': string, 'ends-at': string }> = [];
      json.value.value.forEach((e: object) => {
        const vault = tupleCV(e);
        const data = vault.data.value;
        if (data['is-open'].value) {
          const lotSize = parseInt(data['lots'].value, 10);
          // for (let index = 0; index < lotSize; index++) {
            serializedAuctions.push({
              id: data['id'].value,
              'lot-id': data['lots-sold'].value,
              'collateral-amount': parseFloat(data['collateral-amount'].value) / lotSize,
              'collateral-token': data['collateral-token'].value,
              'debt': parseFloat(data['debt-to-raise'].value) / lotSize,
              'ends-at': data['ends-at'].value
            }); 
          // }
        }
      });

      const getLot = async (auctionId:number, lotId:number) => {
        const lot = await callReadOnlyFunction({
          contractAddress,
          contractName: "auction-engine",
          functionName: "get-last-bid",
          functionArgs: [uintCV(auctionId), uintCV(lotId)],
          senderAddress: stxAddress || '',
          network: network,
        });

        return cvToJSON(lot);
      };

      const lots = await callReadOnlyFunction({
        contractAddress,
        contractName: "auction-engine",
        functionName: "get-winning-lots",
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const jsonLots = cvToJSON(lots);
      let winLot;

      let serializedLots:Array<{ 'lot-id':string, 'auction-id': string, 'collateral-amount': number, 'collateral-token': string, 'xusd': number }> = [];
      jsonLots.value.ids.value.forEach(async (e: object) => {
        const lot = tupleCV(e);
        const data = lot.data.value;
        if (data['auction-id'].value !== 0) {
          winLot = await getLot(data['auction-id'].value, data['lot-index'].value);

          if (winLot && winLot.value['is-accepted'].value) {
            serializedLots.push({
              'lot-id': data['lot-index'].value,
              'auction-id': data['auction-id'].value,
              'collateral-amount': winLot.value['collateral-amount'].value,
              'collateral-token': winLot.value['collateral-token'].value,
              'xusd': winLot.value['xusd'].value
            });
            setLots(serializedLots);
          }
        }
      });
      setAuctions(serializedAuctions);
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  return (
    <Box>
      {state.userData ? (
        <Container>
          <Box py={6}>
            <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
              <div className="mt-8">

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">Your Winning Lots</h2>

                  {lots.length > 0 ? (
                    <LotGroup lots={lots} />
                  ) : (
                    <p className="mt-2">You have no winning lots you can redeem.</p>
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
