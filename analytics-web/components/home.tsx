import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Pools } from './pools';
import { Prices } from './prices';
import { Vaults } from './vaults';
import { Tvl } from './tvl';
import { MarketCap } from './market-cap';
import { TokenPriceSelect } from './token-price-select';
import { callReadOnlyFunction, stringAsciiCV, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { DefiLlama } from './defillama';
import { BuyBackBurn } from './buyback-burn';

async function asyncForEach(array: any, callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const getPrice = async (symbol: string) => {
  if (symbol === 'USDA') {
    return 1000000;
  } else if (symbol === 'wLDN' || symbol === 'LDN') {
    return 62280202;
  }

  const contractAddress = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR';
  const fetchedPrice = await callReadOnlyFunction({
    contractAddress,
    contractName: 'arkadiko-oracle-v3-1',
    functionName: 'get-price',
    functionArgs: [stringAsciiCV(symbol || 'stx')],
    senderAddress: contractAddress,
    network: network,
  });
  const json = cvToJSON(fetchedPrice);

  return json.value.value['last-price'].value;
};

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
  } else if (token === 'lydian-token') {
    return 'LDN';
  } else if (token === 'wstx-token') {
    return 'STX';
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
};

export const Home: React.FC = () => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const [pools, setPools] = useState([]);
  const [poolData, setPoolData] = useState([]);
  const [highchartsOptions, setHighchartsOptions] = useState<Highcharts.Options>();
  const [lastDikoPrice, setLastDikoPrice] = useState(0);
  const [vaultData, setVaultData] = useState({});
  const tokenPrices = [
    { id: 1, name: 'STX/USDA' },
    { id: 2, name: 'DIKO/USDA' },
    { id: 3, name: 'STX/DIKO' },
    { id: 4, name: 'STX/xBTC' },
    { id: 5, name: 'xBTC/USDA' },
    { id: 6, name: 'STX/WELSH' },
  ];
  const [tokenGraph, setTokenGraph] = useState(tokenPrices[1]);

  useEffect(() => {
    const fetchPoolTvl = async pool => {
      const nameX = tokenToName(pool['token_x_name']);
      const nameY = tokenToName(pool['token_y_name']);

      const priceX = (await getPrice(nameX)) / Math.pow(10, 6);
      const priceY = (await getPrice(nameY)) / Math.pow(10, 6);
      // setPriceX(priceX);
      // setPriceY(priceY);
      const tvlX = (pool['tvl_token_x'] * priceX) / Math.pow(10, decimals(nameX));
      const tvlY = (pool['tvl_token_y'] * priceY) / Math.pow(10, decimals(nameY));
      const tvl = tvlX + tvlY;
      // setTvl(tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

      return [priceX, priceY, tvl, nameX, nameY];
    };

    const fetchPools = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools`);
      const array: any = [];
      await asyncForEach(response.data.pools, async (pool: any) => {
        if (pool['token_x_name'] !== 'wxusd' && !pool['token_x_name'].includes('lydian-token')) {
          const poolData = await fetchPoolTvl(pool);
          pool['priceX'] = poolData[0];
          pool['priceY'] = poolData[1];
          pool['tvl'] = poolData[2];
          pool['nameX'] = poolData[3];
          pool['nameY'] = poolData[4];
          array.push(pool);
        }
      });

      const sortedTvl = array.sort(function (a, b) {
        return Number(b['tvl']) - Number(a['tvl']);
      });
      setPools(sortedTvl);
    };
    const fetchVaults = async () => {
      // const response = await axios.get(`${apiUrl}/api/v1/vaults`);
      setVaultData([]);
    };
    const fetchDikoPrice = async () => {
      const dikoResponse = await axios.get(`${apiUrl}/api/v1/pools/2/prices`);
      const prices = dikoResponse.data.prices;
      setLastDikoPrice(prices[prices.length - 1][1].toFixed(2));
    };
    const fetchPoolData = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/tickers`);
      setPoolData(response.data);
    };

    fetchPools();
    fetchPoolData();
    fetchVaults();
    fetchDikoPrice();
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/${tokenGraph.id}/prices`);
      const prices = response.data.prices;

      let decimals = 6;
      if (tokenGraph['name'].includes('xBTC')) {
        decimals = 8;
      }
      setHighchartsOptions({
        rangeSelector: {
          selected: 0,
        },
        chart: {
          zoomType: 'x',
          spacingTop: 40,
          spacingRight: 24,
          spacingBottom: 32,
          spacingLeft: 24,
          style: {
            fontFamily: 'Montserrat',
          },
        },
        navigator: {
          enabled: false,
        },
        scrollbar: {
          enabled: false,
        },
        tooltip: {
          valueDecimals: decimals,
          backgroundColor: '#314155',
          borderWidth: 0,
          borderRadius: 8,
          shadow: false,
          style: {
            color: '#FFF',
          },
        },
        title: {
          text: null,
        },
        xAxis: {},
        yAxis: [
          {
            lineWidth: 1,
            min: 0,
            title: {
              text: 'Exchange rate',
            },
            labels: {
              overflow: 'justify',
            },
          },
          {
            lineWidth: 1,
            linkedTo: 0,
            opposite: false,
          },
        ],
        legend: {
          enabled: false,
        },
        plotOptions: {
          area: {
            fillColor: {
              linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1,
              },
              stops: [
                [0, '#6366f1'], //indigo-500
                [1, 'rgba(67, 56, 202, .05)'],
              ],
            },
            marker: {
              radius: 1,
              fillColor: '#4f46e5', //indigo-600
              lineWidth: 1,
              lineColor: '#4f46e5', //indigo-600
              states: {
                hover: {
                  radiusPlus: 2,
                  lineWidthPlus: 2,
                },
              },
            },
            lineColor: '#4f46e5', //indigo-600
            lineWidth: 1,
            states: {
              hover: {
                lineWidth: 1,
                lineColor: '#4338ca', //indigo-700
              },
            },
            threshold: null,
          },
        },

        series: [
          {
            type: 'area',
            name: `${tokenGraph.name}`,
            data: prices,
            color: '#6366f1',
          },
        ],
      });
    };

    fetchPrices();
  }, [tokenGraph]);

  return (
    <>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl text-gray-900 font-headings">Dashboard</h1>
      </div>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        <Tvl />

        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
            <h3 className="text-lg leading-6 text-gray-900 font-headings">
              {tokenGraph.name} price
            </h3>
            <div className="w-full max-w-[180px]">
              <TokenPriceSelect
                tokenPrices={tokenPrices}
                selected={tokenGraph}
                setSelected={setTokenGraph}
              />
            </div>
          </header>
          <div className="mt-4 border border-gray-200 rounded-lg">
            <HighchartsReact
              highcharts={Highcharts}
              containerProps={{ className: 'rounded-lg' }}
              constructorType={'stockChart'}
              options={highchartsOptions}
            />
          </div>
        </section>

        <DefiLlama />

        <MarketCap lastDikoPrice={lastDikoPrice} lastUsdaPrice={1.0} />

        <BuyBackBurn />

        <Pools pools={pools} poolData={poolData} />

        {vaultData && vaultData.count > 0 ? <Vaults vaultData={vaultData} /> : null}

        <Prices />
      </div>
    </>
  );
};
