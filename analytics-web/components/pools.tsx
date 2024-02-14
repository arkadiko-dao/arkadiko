import React, { useEffect, useState } from 'react';
import { PoolRow } from './pool-row';

export const Pools: React.FC = ({pools}) => {
  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
        <div>
          <h3 className="text-lg leading-6 text-gray-900 font-headings">Pools</h3>
        </div>
      </header>
      <div className="mt-4">
        {pools.length > 0 ? (
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Pool
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          TVL
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Volume 24H
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Volume 7D
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pools.map((pool) => (
                        <PoolRow
                          key={pool.id}
                          id={pool.id}
                          pool={pool}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ): (
          <span>Loading...</span>
        )}
      </div>
    </section>
  );
};


