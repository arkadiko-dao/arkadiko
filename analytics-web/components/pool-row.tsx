import React, { useEffect, useState } from 'react';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, stringAsciiCV, cvToJSON } from '@stacks/transactions';
import axios from 'axios';
import { tokenList } from '../../web/components/token-swap-list';
import { Placeholder } from '../../web/components/ui/placeholder';

// create utils + oracle price fetch
const tokenToName = (token: string) => {
  if (token === 'wrapped-stx-token') {
    return 'STX';
  } else if (token === 'arkadiko-token') {
    return 'DIKO';
  } else if (token === 'usda-token') {
    return 'USDA';
  } else if (token === 'Wrapped-Bitcoin') {
    return 'xBTC';
  } else if (token === 'welshcorgicoin-token') {
    return 'WELSH';
  } else if (token === 'wrapped-lydian-token') {
    return 'wLDN';
  } else {
    return '';
  }
};

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

const getPrice = async (symbol: string) => {
  if (symbol === 'USDA') {
    return 1000000;
  } else if (symbol === 'wLDN') {
    return 83280202;
  }

  const contractAddress = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR';
  const fetchedPrice = await callReadOnlyFunction({
    contractAddress,
    contractName: "arkadiko-oracle-v1-1",
    functionName: "get-price",
    functionArgs: [stringAsciiCV(symbol || 'stx')],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);

  return json.value['last-price'].value;
};

export const PoolRow: React.FC = ({ id, pool }) => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const [priceX, setPriceX] = useState(0);
  const [priceY, setPriceY] = useState(0);
  const [volume24, setVolume24] = useState('0');
  const [volume7, setVolume7] = useState('0');
  const [tvl, setTvl] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const nameX = tokenToName(pool['token_x_name']);
  const nameY = tokenToName(pool['token_y_name']);

  const tokenLogoX = tokenList.find(token => token['name'] === nameX);
  const tokenLogoY = tokenList.find(token => token['name'] === nameY);

  useEffect(() => {
    const fetchTVL = async () => {
      const priceX = await getPrice(nameX) / Math.pow(10, 6);
      const priceY = await getPrice(nameY) / Math.pow(10, 6);
      setPriceX(priceX);
      setPriceY(priceY);
      const tvlX = pool['tvl_token_x'] * priceX / Math.pow(10, decimals(nameX));
      const tvlY = pool['tvl_token_y'] * priceY / Math.pow(10, decimals(nameY));
      setTvl((tvlX + tvlY).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setIsLoading(false);
    }

    fetchTVL();
  }, [nameX, nameY]);

  useEffect(() => {
    const fetchVolume24 = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${pool.id}/volume?period=24`);
      const volumeX = priceX * response.data.volume[0] / Math.pow(10, decimals(nameX));
      const volumeY = priceY * response.data.volume[1] / Math.pow(10, decimals(nameY));
      setVolume24((volumeX + volumeY).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };
    const fetchVolume7 = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${pool.id}/volume?period=7`);
      const volumeX = priceX * response.data.volume[0] / Math.pow(10, decimals(nameX));
      const volumeY = priceY * response.data.volume[1] / Math.pow(10, decimals(nameY));
      setVolume7((volumeX + volumeY).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    fetchVolume24();
    fetchVolume7();
  }, [priceX, priceY]);

  return (
    <tr className="bg-white">
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
          <span>${tvl}</span>
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
