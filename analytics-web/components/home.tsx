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
      setPrices(response.data.prices);
    };

    fetchDikoPrices();
  }, []);

  const options: Highcharts.Options = {
    title: {
      text: 'DIKO/USDA price'
    },
    series: [{
      type: 'line',
      data: prices
    }]
  };

  return (
    <Container>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />

      <span>Pools</span>
      {pools.length > 0 ? (
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pool
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TVL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume 24H
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
    </Container>
  );
};
