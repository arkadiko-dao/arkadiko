import React, { useEffect, useState } from 'react';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, stringAsciiCV, cvToJSON } from '@stacks/transactions';
import axios from 'axios';
import { tokenList } from '../../web/components/token-swap-list';
import { Placeholder } from '../../web/components/ui/placeholder';

const decimals = (token: string) => {
  if (token === 'STX') {
    return 6;
  } else if (token === 'DIKO') {
    return 6;
  } else if (token === 'USDA') {
    return 6;
  } else if (token === 'xBTC') {
    return 8;
  } else {
    return 6;
  }
}

export const PoolRow: React.FC = ({ id, pool, data }) => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const [volume24, setVolume24] = useState('0');
  const [volume7, setVolume7] = useState('0');
  const [poolTvl, setPoolTvl] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  const nameX = pool['nameX'];
  const nameY = pool['nameY'];
  const tokenLogoX = tokenList.find(token => token['name'] === pool['nameX']);
  const tokenLogoY = tokenList.find(token => token['name'] === pool['nameY']);

  useEffect(() => {
    const fetchVolume24 = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${pool.id}/volume?period=24`);
      const volumeX = pool['priceX'] * response.data.volume[0] / Math.pow(10, decimals(nameX));
      const volumeY = pool['priceY'] * response.data.volume[1] / Math.pow(10, decimals(nameY));
      setVolume24((volumeX + volumeY).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };
    const fetchVolume7 = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${pool.id}/volume?period=7`);
      const volumeX = pool['priceX'] * response.data.volume[0] / Math.pow(10, decimals(nameX));
      const volumeY = pool['priceY'] * response.data.volume[1] / Math.pow(10, decimals(nameY));
      setVolume7((volumeX + volumeY).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    if (!data) {
      fetchVolume24();
      setPoolTvl(pool['tvl'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      const vol24 = (data['base_volume'] * data['base_price']) + (data['target_volume'] * data['target_price']);
      setVolume24(vol24.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setPoolTvl(data['liquidity_in_usd'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    fetchVolume7();
    setIsLoading(false);
  }, [pool, data]);

  return (
    <tr className="bg-white" key={id}>
      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
        <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
          <div className="flex shrink-0 mr-2 -space-x-2 overflow-hidden">
            <img
              className="shrink-0 inline-block w-8 h-8 rounded-full ring-2 ring-white"
              src={tokenLogoX?.logo}
              alt=""
            />
            <img
              className="shrink-0 inline-block w-8 h-8 rounded-full ring-2 ring-white"
              src={tokenLogoY?.logo}
              alt=""
            />
          </div>
          {nameX}/{nameY}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {isLoading ? (
          <Placeholder className="py-2" width={Placeholder.width.HALF} />
          ) : (
          <span>${poolTvl}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {isLoading ? (
          <Placeholder className="py-2" width={Placeholder.width.HALF} />
          ) : (
          <span>${volume24}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {isLoading ? (
          <Placeholder className="py-2" width={Placeholder.width.HALF} />
          ) : (
          <span>${volume7}</span>
        )}
      </td>
    </tr>
  );
};
