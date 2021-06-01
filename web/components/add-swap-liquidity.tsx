import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Landing } from './landing';
import { Container } from './home'
import { microToReadable } from '@common/vault-utils';
import { callReadOnlyFunction, cvToJSON, contractPrincipalCV, uintCV } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { tokenTraits } from '@common/vault-utils';

export const AddSwapLiquidity: React.FC = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const currencyA = match.params.currencyIdA;
  const currencyB = match.params.currencyIdB;
  const tokenXContract = tokenTraits[currencyA.toLowerCase()]['name'];
  const tokenYContract = tokenTraits[currencyB.toLowerCase()]['name'];
  websocketTxUpdater();

  return (
    <Box>
      {state.userData ? (
        <Container>
          <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
            <div className="mt-8">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Add Liquidity on {currencyA}-{currencyB}
              </h2>

              <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-5 lg:grid-cols-5">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {currencyA} balance
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {microToReadable(state.balance[currencyA.toLowerCase()])} STX
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {currencyB} balance
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {microToReadable(state.balance[currencyB.toLowerCase()])} xUSD
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>
        </Container>
      ) : (
        <Landing />
      )}
    </Box>
  );
};
