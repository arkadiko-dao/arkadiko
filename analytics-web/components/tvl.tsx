import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const Tvl: React.FC = () => {
  const [loadingPrices, setLoadingPrices] = useState(true);
  const apiUrl = 'https://arkadiko-api.herokuapp.com';

  useEffect(() => {
    const fetchPrices = async () => {
      let response: any = await axios.get(`${apiUrl}/api/v1/blockchains/1`);
      response = response['data'];

      setLoadingPrices(false);
    };

    setLoadingPrices(true);
    fetchPrices();
  }, []);

  return (
    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">
          Total TVL
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          71,897
        </dd>
      </div>

      <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">
          Vaults TVL
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          58.16%
        </dd>
      </div>

      <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">
          Swap TVL
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          24.57%
        </dd>
      </div>
    </dl>
  );
};
