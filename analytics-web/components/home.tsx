import React, { useEffect, useState } from 'react';
import { PoolRow } from './pool-row';
import axios from 'axios';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Pools } from './pools';
import { Prices } from './prices';
import { Vaults } from './vaults';
import { MarketCap } from './market-cap';

export const Home: React.FC = () => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const [pools, setPools] = useState([]);
  const [prices, setPrices] = useState([]);
  const [lastDikoPrice, setLastDikoPrice] = useState(0);
  const [vaultData, setVaultData] = useState({});

  useEffect(() => {
    const fetchPools = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools`);
      const array:any = [];
      response.data.pools.forEach((pool:any) => {
        array.push(
          <PoolRow
            key={pool.id}
            id={pool.id}
            pool={pool}
          />
        )
      })
      setPools(array);
    };
    const fetchVaults = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/vaults`);
      setVaultData(response.data);
    };

    fetchPools();
    fetchVaults();
  }, []);

  useEffect(() => {
    const fetchDikoPrices = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/2/prices`);
      const prices = response.data.prices;
      setPrices(prices);
      setLastDikoPrice(prices[prices.length - 1][1]);
    };

    fetchDikoPrices();
  }, []);

  const options: Highcharts.Options = {
    rangeSelector: {
      selected: 0
    },
    chart: {
      zoomType: 'x',
      spacingTop: 40,
      spacingRight: 24,
      spacingBottom: 32,
      spacingLeft: 24,
      style: {
        fontFamily: 'Montserrat'
      },
    },
    navigator: {
      enabled: false
    },
    scrollbar: {
      enabled: false
    },
    tooltip: {
      backgroundColor: '#314155',
      borderWidth: 0,
      borderRadius: 8,
      shadow: false,
      style: {
        color: '#FFF',
      }
    },
    title: {
      text: null
    },
    xAxis: {
      
    },
    yAxis: [{
      lineWidth: 1,
      min: 0,
      title: {
        text: 'Exchange rate',
      },
      labels: {
        overflow: 'justify'
      }
    },{
      lineWidth: 1,
      linkedTo: 0,
      opposite: false
    }],
    legend: {
      enabled: false
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, '#6366f1'], //indigo-500
            [1, 'rgba(67, 56, 202, .05)']
          ]
        },
        marker: {
          radius: 1,
          fillColor: '#4f46e5', //indigo-600 
          lineWidth: 1,
          lineColor: '#4f46e5', //indigo-600
          states: {
            hover: {
              radiusPlus: 2,
              lineWidthPlus: 2
            }
          }
        },
        lineColor: '#4f46e5', //indigo-600
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1,
            lineColor: '#4338ca', //indigo-700
          }
        },
        threshold: null
      },
    },

    series: [{
      type: 'area',
      name: 'DIKO to USDA',
      data: prices,
      color: '#6366f1'
    }]
  };

  return (
    <>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl text-gray-900 font-headings">Dashboard</h1>
      </div>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        <section className="mt-8">
          <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
            <div>
              <h3 className="text-lg leading-6 text-gray-900 font-headings">DIKO price</h3>
            </div>
          </header>
          <div className="mt-4 border border-gray-200 rounded-lg">
            <HighchartsReact
              highcharts={Highcharts}
              containerProps={{className:'rounded-lg'}}
              constructorType={'stockChart'}
              options={options}
            />
          </div>
        </section>

        <MarketCap lastDikoPrice={lastDikoPrice} lastUsdaPrice={1.00} />

        <Pools pools={pools} />

        {vaultData && vaultData.count > 0 ? (
          <Vaults vaultData={vaultData} />
        ) : null}

        <Prices />
      </div>
    </>
  );
};
