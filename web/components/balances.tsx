import React, { useContext } from 'react';
import { Box } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { SmartContractBalance } from './smart-contract-balance';

export const Balances = () => {
  const [state, _] = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const addresses = [
    `${contractAddress}.arkadiko-stx-reserve-v1-1`,
    `${contractAddress}.arkadiko-sip10-reserve-v1-1`,
    `${contractAddress}.arkadiko-freddie-v1-1`,
    `${contractAddress}.arkadiko-auction-engine-v1-1`,
    `${contractAddress}.arkadiko-dao`,
    `${contractAddress}.arkadiko-governance-v1-1`,
    `${contractAddress}.arkadiko-diko-guardian-v1-1`,
    `${contractAddress}.arkadiko-swap-v1-1`,
  ]
  let index = -1;
  const contractBalances = addresses.map((address:string) => {
    index += 1;
    return (<SmartContractBalance
      key={index}
      address={address}
    />);
  });

  return (
    <Box>
      {state.userData ? (
        <Container>
          <Box py={6}>
            <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                  <div className="bg-indigo-700">
                    <div className="max-w-2xl mx-auto text-center py-5 px-4 sm:py-5 sm:px-6 lg:px-8">
                      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        <span className="block">Arkadiko Balances</span>
                      </h2>
                      <p className="mt-4 text-lg leading-6 text-indigo-200">
                        An overview of all Arkadiko smart contracts and their balances
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contract Name
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            STX Balance
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DIKO Balance
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            xUSD Balance
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            wSTX Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contractBalances}
                      </tbody>
                    </table>
                  </div>

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
