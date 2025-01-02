import React from 'react';
import { tokenList } from '../../web/components/token-swap-list';
import { BuyBackEntry } from './buyback-entry';
import { BuyBackEntryMobile } from './buyback-entry-mobile';

export const BuyBackBurn: React.FC = () => {
  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
        <div>
          <h3 className="text-lg leading-6 text-gray-900 font-headings">
            DIKO Buybacks &amp; Burn
          </h3>
        </div>
      </header>

      <div className="min-w-full mt-4 overflow-hidden overflow-x-auto align-middle border border-gray-200 rounded-lg dark:border-zinc-600 lg:hidden">
        <div className="bg-white dark:bg-zinc-800">
          <div className="mx-auto bg-white dark:bg-zinc-800 max-w-7xl">
            <div className="max-w-2xl mx-auto space-y-2 divide-y divide-gray-200 dark:divide-zinc-600">
              <BuyBackEntryMobile
                txid="0x5faffd5bea74f695c891eb659d435e784855ef6c55cd827770d7d8fcfc91b519"
                date="January 2nd, 2025"
                burned="83,715"
                cumulative="318,708"
                supply="99,136,433"
              />

              <BuyBackEntryMobile
                txid="0xf9197e024322d66bfbbf09071d233e30643bedc1cb4bced530a236e672e4d613"
                date="December 28th, 2024"
                burned="75,744"
                cumulative="234,993"
                supply="99,455,141"
              />

              <BuyBackEntryMobile
                txid="c2118283646b85d438c22aee893a839e7dd10c27b8d150716a5478e6d8770d11"
                date="December 22nd, 2024"
                burned="66,632"
                cumulative="159,249"
                supply="99,690,134"
              />

              <BuyBackEntryMobile
                txid="0x84c451d7281045fadf310946592e9738d8c0fc7fa080e041d72cdf70db04ec53"
                date="December 17th, 2024"
                burned="46,148"
                cumulative="92,617"
                supply="99,849,383"
              />

              <BuyBackEntryMobile
                txid="0xa81cf5629c32831de2ebcba39d7df1f0d8cd40247b6479c19f86b84e37c3462d"
                date="December 9th, 2024"
                burned="46,469"
                cumulative="46,469"
                supply="99,895,531"
              />

              {false && (
                <section className="py-2 text-center">
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Expand
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col hidden mt-4 lg:block">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      DIKO Burnt
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Cumulative DIKO Burnt
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Total Supply
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <BuyBackEntry
                    txid="0x5faffd5bea74f695c891eb659d435e784855ef6c55cd827770d7d8fcfc91b519"
                    date="January 2nd, 2025"
                    burned="83,715"
                    cumulative="318,708"
                    supply="99,136,433"
                  />

                  <BuyBackEntry
                    txid="0xf9197e024322d66bfbbf09071d233e30643bedc1cb4bced530a236e672e4d613"
                    date="December 28th, 2024"
                    burned="75,744"
                    cumulative="234,993"
                    supply="99,455,141"
                  />

                  <BuyBackEntry
                    txid="c2118283646b85d438c22aee893a839e7dd10c27b8d150716a5478e6d8770d11"
                    date="December 22nd, 2024"
                    burned="66,632"
                    cumulative="159,249"
                    supply="99,690,134"
                  />

                  <BuyBackEntry
                    txid="0x84c451d7281045fadf310946592e9738d8c0fc7fa080e041d72cdf70db04ec53"
                    date="December 17th, 2024"
                    burned="46,148"
                    cumulative="92,617"
                    supply="99,849,383"
                  />

                  <BuyBackEntry
                    txid="0xa81cf5629c32831de2ebcba39d7df1f0d8cd40247b6479c19f86b84e37c3462d"
                    date="December 9th, 2024"
                    burned="46,469"
                    cumulative="46,469"
                    supply="99,895,531"
                  />

                  {false && (
                    <tr>
                      <td colSpan={4}>
                        <div className="text-center">
                          <button
                            className="inline-flex items-center justify-center px-4 py-2 my-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                            type="button"
                          >
                            Expand
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
