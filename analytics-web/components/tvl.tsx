import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Placeholder } from '../../web/components/ui/placeholder';
import { Tooltip } from '@blockstack/ui';
import { InformationCircleIcon } from '@heroicons/react/solid';

export const Tvl: React.FC = () => {
  const [loadingTvl, setLoadingTvl] = useState(true);
  const [totalTvl, setTotalTvl] = useState(0.0);
  const [vaultsTvl, setVaultsTvl] = useState(0.0);
  const [swapTvl, setSwapTvl] = useState(0.0);
  const apiUrl = 'https://arkadiko-api.herokuapp.com';

  useEffect(() => {
    const fetchTvl = async () => {
      let response: any = await axios.get(`${apiUrl}/api/v1/blockchains/1`);
      response = response['data'];
      const swapTvl = response['swap_tvl'];
      const vaultsTvl = response['vaults_tvl'];

      setSwapTvl(swapTvl);
      setVaultsTvl(vaultsTvl);
      setTotalTvl(swapTvl + vaultsTvl);
      setLoadingTvl(false);
    };

    setLoadingTvl(true);
    fetchTvl();
  }, []);

  const stats = [
    {
      name: 'Total TVL',
      stat: totalTvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      name: 'Vaults TVL',
      stat: vaultsTvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      name: 'Swap TVL',
      stat: swapTvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      info: 'Dollar amount of all the tokens that are deposited as liquidity for swapping.'
    },
  ]

  return (
    <div>
      <dl className="grid grid-cols-1 mt-5 overflow-hidden bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="inline-flex items-center text-base font-normal text-gray-500">
              {item.name}

              {item.info ? (
                <Tooltip
                  label={item.info}
                  shouldWrapChildren={true}
                >
                  <InformationCircleIcon
                    className="block w-5 h-5 ml-2 text-gray-400"
                    aria-hidden="true"
                  />
                </Tooltip>
              ) : null}
            </dt>
            <dd className="flex items-baseline justify-between mt-1 md:block lg:flex">
              {loadingTvl ? (
                <Placeholder className="py-2" width={Placeholder.width.FULL} />
              ) : (
                <div className="text-2xl font-semibold text-indigo-600">
                  <span className="text-sm">$</span>{' '} {item.stat}
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
