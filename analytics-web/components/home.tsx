import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'
import {
  TrendingUpIcon,
  ScaleIcon,
  MenuIcon,
  UserIcon,
  XIcon,
} from '@heroicons/react/outline'
import { PoolRow } from './pool-row';
import axios from 'axios';
import * as Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { classNames } from '@common/class-names';


export const Home: React.FC = () => {
  const apiUrl = 'http://localhost:3000'; // TODO: process.env.REACT_APP_OFFCHAIN_API;
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pools, setPools] = useState([]);
  const [prices, setPrices] = useState([]);

  const navigation = [
    { name: 'Dashboard', href: '#', icon: TrendingUpIcon, current: true },
    { name: 'Balances', href: '#', icon: ScaleIcon, current: false },
  ]
  

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
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-40 flex md:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative flex flex-col flex-1 w-full max-w-xs bg-gray-800">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 pt-2 -mr-12">
                    <button
                      type="button"
                      className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XIcon className="w-6 h-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-center flex-shrink-0 px-4">
                    <svg className="w-auto h-6 text-white lg:block sm:h-8" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" /></svg>

                    <span className="inline-block ml-2 text-xl font-bold text-white align-middle font-headings">Arkadiko</span>
                    <span className="ml-1 text-lg font-semibold tracking-widest text-indigo-400 uppercase">Analytics</span>
                  </div>
                  <nav className="px-4 mt-5 space-y-1">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    ))}
                  </nav>
                </div>
                <div className="flex flex-shrink-0 p-4 bg-gray-700">
                  <a href="#" className="flex-shrink-0 block group">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full">
                        <UserIcon className="flex-shrink-0 w-6 h-6 text-gray-300" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-base font-medium text-white">SPM45...ZVY56</p>
                        <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Your data</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-col flex-1 min-h-0 bg-gray-800">
            <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <svg className="w-auto h-8 text-white lg:block sm:h-8" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" /></svg>
                <div className="flex flex-col">
                  <div className="ml-4 text-lg font-bold leading-none text-white align-middle font-headings">Arkadiko</div>
                  <div className="ml-4 mt-0.5 text-base font-semibold leading-none tracking-widest text-indigo-400 uppercase">Analytics</div>
                </div>
              </div>
              <nav className="flex-1 px-4 mt-5 space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                        'mr-3 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 p-4 bg-gray-700">
              <a href="#" className="flex-shrink-0 block w-full group">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full">
                    <UserIcon className="flex-shrink-0 w-6 h-6 text-gray-300" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">SPM45...ZVY56</p>
                    <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Your data</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-1 md:pl-64">
          <div className="sticky top-0 z-10 pt-1 pl-1 bg-gray-100 md:hidden sm:pl-3 sm:pt-3">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          <main className="flex-1">
            <div className="py-6">
              <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
                <section className="mt-8">
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
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
