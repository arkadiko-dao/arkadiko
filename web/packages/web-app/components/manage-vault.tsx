import React from 'react';
import { Box } from '@blockstack/ui';
import { Container } from './home';
import { NavLink as RouterLink } from 'react-router-dom'

export const ManageVault = ({ match }) => {
  return (
    <Container>
      <Box py={6}>
        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <h1 className="text-2xl leading-6 font-medium text-gray-900 mb-4">
              STX/xUSD Vault #{match.params.id}
            </h1>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                Liquidation Price
              </h2>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                Collateral to Debt Ratio
              </h2>
            </li>
          </ul>

          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    $0.7 USD (STX/USD)
                  </h2>
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Current Price Information
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        1.1 USD
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Liquidation Penalty
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        13%
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    200%
                  </h2>
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Minimum Ratio (before liquidation)
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        150%
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Stability Fee
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        0.0%
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>
          </ul>






          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-8">
            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                STX Locked
              </h2>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                Outstanding xUSD debt
              </h2>
            </li>
          </ul>

          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between mb-5">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        STX Locked
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>
                        5 STX
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        <RouterLink to={`vaults/2`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          Deposit
                        </RouterLink>
                      </p>
                    </div>
                  </div>
                  <hr/>

                  <div className="mt-5 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Able to withdraw
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>
                        0 STX
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        <RouterLink to={`vaults/2`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          Withdraw
                        </RouterLink>
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between mb-5">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Outstanding xUSD debt
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        5 xUSD
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        <RouterLink to={`vaults/2`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          Payback
                        </RouterLink>
                      </p>
                    </div>
                  </div>
                  <hr/>

                  <div className="mt-5 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Available to mint
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        0 xUSD
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        <RouterLink to={`vaults/2`} exact className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          Mint
                        </RouterLink>
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>
          </ul>


        </main>
      </Box>
    </Container>
  )
};
