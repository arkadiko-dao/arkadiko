import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Placeholder } from '../../web/components/ui/placeholder';

export const Tvl: React.FC = () => {
  const [loadingTvl, setLoadingTvl] = useState(true);
  const [totalTvl, setTotalTvl] = useState(0.0);
  const [vaultsTvl, setVaultsTvl] = useState(0.0);
  const [swapTvl, setSwapTvl] = useState(0.0);
  const apiUrl = 'https://arkadiko-api.herokuapp.com';

  useEffect(() => {
    const fetchTvl = async () => {
      // let response: any = await axios.get(`${apiUrl}/api/v1/blockchains/1`);
      // response = response['data'];

      setLoadingTvl(false);
    };

    setLoadingTvl(true);
    fetchTvl();
  }, []);

  return (
    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">
          Total TVL
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {loadingTvl ? (
            <Placeholder className="justify-end py-2" width={Placeholder.width.FULL} />
          ) : (
            <p>
              <span className="text-base font-medium text-gray-500">$</span>{' '}
              <span className="text-4xl font-extrabold text-gray-700 dark:text-zinc-100">
                {totalTvl}
              </span>
            </p>
          )}
        </dd>
      </div>

      <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">
          Vaults TVL
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {loadingTvl ? (
            <Placeholder className="justify-end py-2" width={Placeholder.width.FULL} />
          ) : (
            <p>
              <span className="text-base font-medium text-gray-500">$</span>{' '}
              <span className="text-4xl font-extrabold text-gray-700 dark:text-zinc-100">
                {vaultsTvl}
              </span>
            </p>
          )}
        </dd>
      </div>

      <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">
          Swap TVL
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {loadingTvl ? (
            <Placeholder className="justify-end py-2" width={Placeholder.width.FULL} />
          ) : (
            <p>
              <span className="text-base font-medium text-gray-500">$</span>{' '}
              <span className="text-4xl font-extrabold text-gray-700 dark:text-zinc-100">
                {swapTvl}
              </span>
            </p>
          )}
        </dd>
      </div>
    </dl>
  );
};
