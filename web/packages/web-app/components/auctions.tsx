import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box, Text } from '@blockstack/ui';
import { Redirect } from 'react-router-dom';
import { Container } from './home'
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { callReadOnlyFunction, cvToJSON, tupleCV, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { AuctionGroup } from '@components/auction-group';
import { LotGroup } from '@components/lot-group';

export const Auctions: React.FC = () => {
  const state = useContext(AppContext);
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const [auctions, setAuctions] = useState([]);
  const [lots, setLots] = useState([]);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const registerStacker = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress,
      contractName: 'stacker-registry',
      functionName: 'register',
      functionArgs: [],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished registering stacking!', data);
        window.location.href = '/';
      },
    });
  };

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
        if (true) { //data['is-open'].value) {
          const lotSize = parseInt(data['lots'].value, 10);
          for (let index = 0; index < lotSize; index++) {
            serializedAuctions.push({
              id: data['id'].value,
              'lot-id': index,
              'collateral-amount': parseFloat(data['collateral-amount'].value) / lotSize,
              'debt': parseFloat(data['debt-to-raise'].value) / lotSize,
              'ends-at': data['ends-at'].value
            }); 
          }
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

      let serializedLots:Array<{ 'lot-id':string, 'auction-id': string, 'collateral-amount': number, 'xusd': number }> = [];
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

                  <div className="hidden sm:block mb-5">
                    <div className="flex flex-col">
                      <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg"></div>
                      {state.isStacker ? (
                        <p>You are a registered stacker and are able to buy up auctions.</p>
                      ) : (
                        <Box my="base">
                          <Text onClick={() => registerStacker()}
                                _hover={{ cursor: 'pointer'}}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-5">
                            Register as Stacker
                          </Text>
                        </Box>
                      )}
                    </div>
                  </div>

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
