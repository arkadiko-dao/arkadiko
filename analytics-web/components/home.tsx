import React, { useEffect, useState } from 'react';
import { PoolRow } from './pool-row';
import axios from 'axios';
import * as Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ContainerProps {}
export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return (
    <div className="w-full min-h-screen bg-gray-100" {...props}>
      <div className="px-6 mx-auto max-w-7xl lg:px-8">
        {children}
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const apiUrl = 'http://localhost:3000'; // TODO: process.env.REACT_APP_OFFCHAIN_API;
  const [pools, setPools] = useState([]);
  const [prices, setPrices] = useState([]);

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
    
    fetchPools();
  }, []);
  
  useEffect(() => {
    const fetchDikoPrices = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools/2/prices`);
      console.log(response.data)
      setPrices(response.data.prices);
    };

    fetchDikoPrices();
  }, []);

  const options: Highcharts.Options = {
    chart: {
      zoomType: 'x',
      spacingTop: 40,
      spacingRight: 24,
      spacingBottom: 32,
      spacingLeft: 24,
      style: {
        fontFamily: 'Montserrat'
      }
    },
    title: {
      text: null
    },
    xAxis: {
      
    },
    yAxis: {
      title: {
        text: 'Exchange rate'
      }
    },
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
    }]
  };
  console.log(prices)

  return (
    <Container>
      <main className="flex-1 py-12">
        <section>
          <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
            <div>
              <h3 className="text-lg leading-6 text-gray-900 font-headings">DIKO price</h3>
            </div>
          </header>
          <div className="mt-4 border-b border-gray-200 shadow sm:rounded-lg">
            <HighchartsReact
              containerProps = {{ className: 'sm:rounded-lg' }}
              highcharts={Highcharts}
              options={options}
            />
          </div>
        </section>

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
                    <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
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
                          {pools}       
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
      </main>
    </Container>
  );
};
