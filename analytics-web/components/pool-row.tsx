import React, { useEffect, useState } from 'react';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, stringAsciiCV, cvToJSON } from '@stacks/transactions';
import axios from 'axios';

// create utils + oracle price fetch
const tokenToName = (token:string) => {
  if (token === 'wrapped-stx-token') {
    return 'STX';
  } else if (token === 'arkadiko-token') {
    return 'DIKO';
  } else if (token === 'usda-token') {
    return 'USDA';
  }
  return '';
};

const getPrice = async (symbol: string) => {
  if (symbol === 'USDA') {
    return 1000000;
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

  useEffect(() => {
    const fetchTVL = async () => {
      const priceX = await getPrice(nameX) / 1000000;
      const priceY = await getPrice(nameY) / 1000000;
      setPriceX(priceX);
      setPriceY(priceY);
      const tvlX = pool['tvl_token_x'] * priceX;
      const tvlY = pool['tvl_token_y'] * priceY;
      setTvl(((tvlX + tvlY) / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setIsLoading(false);
    }

    fetchTVL();
  }, [nameX, nameY]);

  useEffect(() => {
    const fetchVolume24 = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${pool.id}/volume?period=24`);
      const volumeX = priceX * response.data.volume[0];
      const volumeY = priceY * response.data.volume[1];
      setVolume24(((volumeX + volumeY) / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };
    const fetchVolume7 = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${pool.id}/volume?period=7`);
      const volumeX = priceX * response.data.volume[0];
      const volumeY = priceY * response.data.volume[1];
      setVolume7(((volumeX + volumeY) / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    fetchVolume24();
    fetchVolume7();
  }, [priceX, priceY]);

  return (
    <tr className="bg-white">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {nameX}/{nameY}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isLoading ? (
          <span>Loading...</span>
          ) : (
          <span>${tvl}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isLoading ? (
          <span>Loading...</span>
          ) : (
          <span>${volume24}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isLoading ? (
          <span>Loading...</span>
          ) : (
          <span>${volume7}</span>
        )}
      </td>
    </tr>
  );
};
