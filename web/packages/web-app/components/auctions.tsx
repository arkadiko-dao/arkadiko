import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box, Text } from '@blockstack/ui';
import { Redirect } from 'react-router-dom';
import { Container } from './home'
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { callReadOnlyFunction, cvToJSON, tupleCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { AuctionGroup } from '@components/auction-group';

export const Auctions: React.FC = () => {
  const state = useContext(AppContext);
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const [auctions, setAuctions] = useState([]);

  const registerStacker = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
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
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "auction-engine",
        functionName: "get-auctions",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(auctions);
      let serializedAuctions:Array<{ id: string, 'ustx-amount': string }> = [];
      json.value.value.forEach((e: object) => {
        const vault = tupleCV(e);
        const data = vault.data.value;
        if (data['is-open'].value) {
          serializedAuctions.push({
            id: data['id'].value,
            'ustx-amount': data['ustx-amount'].value
          });
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
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">Auctions</h2>

                  <div className="hidden sm:block mb-5">
                    <div className="flex flex-col">
                      <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg"></div>
                      <Box my="base">
                        <Text onClick={() => registerStacker()}
                              _hover={{ cursor: 'pointer'}}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-5">
                          Register as Stacker
                        </Text>
                      </Box>
                    </div>
                  </div>

                  {auctions ? (
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
