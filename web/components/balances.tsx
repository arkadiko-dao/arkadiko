import React, { useEffect, useContext, useState } from 'react';
import { Box } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { getRPCClient } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';

export const Balances = () => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const address = 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-stx-reserve-v1-1';
  const [stxBalance, setStxBalance] = useState(0.0);
  const [dikoBalance, setDikoBalance] = useState(0.0);
  const [xusdBalance, setXusdBalance] = useState(0.0);
  const [wStxBalance, setWStxBalance] = useState(0.0);

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      console.log('wow');
      const client = getRPCClient();
      const url = `${client.url}/extended/v1/address/${address}/balances`;
      const response = await fetch(url, { credentials: 'omit' });
      const data = await response.json();
      console.log(data);
      setStxBalance(data.stx.balance / 1000000);
      const dikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-token::diko`];
      if (dikoBalance) {
        setDikoBalance(dikoBalance);
      } else {
        setDikoBalance(0.0);
      }
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
                        <tr className="bg-white">
                          <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                            {address}
                          </td>
                          <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                            {stxBalance}
                          </td>
                          <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                            {dikoBalance}
                          </td>
                          <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                            {xusdBalance}
                          </td>
                          <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                            {wStxBalance}
                          </td>
                        </tr>
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
