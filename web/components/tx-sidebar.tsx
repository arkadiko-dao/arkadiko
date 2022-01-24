import React, { Fragment, useEffect, useState } from 'react';
import { Disclosure, Dialog, Transition, Listbox } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { getAccountTransactions, getPendingTransactions } from '@common/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import {
  MempoolContractCallTransaction,
  ContractCallTransaction,
} from '@blockstack/stacks-blockchain-api-types';
import { ContractTransaction } from '@components/contract-transaction';
import { Placeholder } from './ui/placeholder';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid';

export const TxSidebar = ({ showSidebar, setShowSidebar }) => {
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<JSX.Element[]>();
  const [pendingTransactions, setPendingTransactions] = useState<JSX.Element[]>();

  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(JSON.parse(localStorage.getItem('arkadiko-stacks-node')) || networks[0]);
  const [networkName, setNetworkName] = useState('');
  const [networkAddress, setNetworkAddress] = useState('');
  const [networkKey, setNetworkKey] = useState('');

  const onInputChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;
    if (event.target.name === 'networkName') {
      setNetworkName(value);
    } else if (event.target.name === 'networkAddress') {
      setNetworkAddress(value);
    } else if (event.target.name === 'networkKey') {
      setNetworkKey(value);
    }
  };

  const addNewNetwork = () => {
    let networks = JSON.parse(localStorage.getItem('arkadiko-stacks-nodes') || '[]');
    const network = {
      name: networkName,
      url: networkAddress,
      key: networkKey
    };
    networks.push(network);
    localStorage.setItem('arkadiko-stacks-nodes', JSON.stringify(networks));
    setSelectedNetwork(network);
  };

  useEffect(() => {
    const network = JSON.parse(localStorage.getItem('arkadiko-stacks-node')) || networks[0];
    if (showSidebar && selectedNetwork['url'] != network['url']) {
      localStorage.setItem('arkadiko-stacks-node', JSON.stringify(selectedNetwork));
      window.location.reload();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    let mounted = true;

    const fetchTransations = async () => {
      if (mounted && address) {
        setIsLoading(true);
        const txs = await getAccountTransactions(address || '', contractAddress || '');
        let index = 0;
        const txMap = txs.map((tx: ContractCallTransaction) => {
          let status = 'error';
          if (tx.tx_status === 'success') {
            status = 'success';
          } else if (tx.tx_status === 'pending') {
            status = 'pending';
          }
          index += 1;
          return <ContractTransaction key={index} transaction={tx} status={status} />;
        });

        setTransactions(txMap);
        const pending = await getPendingTransactions(address || '', contractAddress || '');
        const pendingMap = pending.map((tx: MempoolContractCallTransaction) => {
          index += 1;
          return <ContractTransaction key={index} transaction={tx} status="pending" />;
        });
        setPendingTransactions(pendingMap);
        setIsLoading(false);
      }
    };

    const setAllNetworks = () => {
      let networks = [
        { name: 'Stacks', key: 'stacks', url: 'https://stacks-node-api.mainnet.stacks.co' },
        { name: 'Syvita', key: 'syvita', url: 'https://mainnet.syvita.org' }
      ];
      let addedNetworks = JSON.parse(localStorage.getItem('arkadiko-stacks-nodes') || '[]');
      setNetworks(networks.concat(addedNetworks));
    };

    setAllNetworks();
    if (showSidebar) {
      fetchTransations();
    }
    return () => {
      mounted = false;
    };
  }, [showSidebar]);

  return (
    <Transition show={showSidebar} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-hidden"
        onClose={() => {
          setShowSidebar(false);
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="absolute inset-0 transition-opacity bg-gray-700 bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-md">
                <div className="flex flex-col h-full overflow-y-scroll bg-white shadow-xl dark:bg-zinc-900">
                  <div className="px-4 py-6 bg-indigo-700 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg text-white font-headings">
                        Network Settings
                      </Dialog.Title>
                      <div className="flex items-center ml-3 h-7">
                        <button
                          type="button"
                          className="text-indigo-200 bg-indigo-700 rounded-md hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={() => {
                            setShowSidebar(false);
                          }}
                        >
                          <span className="sr-only">Close panel</span>
                          <XIcon className="w-6 h-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-indigo-300">Switch between networks easily</p>
                    </div>
                  </div>
                  <div className="relative px-4 my-6 sm:px-6">
                    <div className="relative w-72">
                      <Listbox value={selectedNetwork} onChange={setSelectedNetwork}>
                        <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-800">
                          <span className="block truncate dark:text-zinc-50">
                            {selectedNetwork.name}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <SelectorIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute right-0 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg dark:text-zinc-50 dark:bg-zinc-900 max-h-56 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {networks.map(network => (
                              <Listbox.Option
                                key={network.key}
                                value={network}
                                className={({ active }) =>
                                  `${active ? 'text-white bg-indigo-600' : 'text-gray-900'}
                                  cursor-default select-none relative py-2 pl-10 pr-4`
                                }
                              >
                                {({ selected, active }) => (
                                  <div>
                                    <span
                                      className={`${
                                        selected ? 'font-semibold' : 'font-normal'
                                      } block truncate dark:text-zinc-50`}
                                    >
                                      {network.name} ({network.url})
                                    </span>
                                    {selected ? (
                                      <span
                                        className={`${active ? 'text-white' : 'text-indigo-600'}
                                        absolute inset-y-0 left-0 flex items-center pl-3`}
                                      >
                                        <CheckIcon className="w-5 h-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </Listbox>
                    </div>
                    <Disclosure>
                      {() => (
                        <>
                          <Disclosure.Button className="flex items-center px-3 py-2 mt-4 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <span>Add a network</span>
                          </Disclosure.Button>
                          <Disclosure.Panel className="p-4 mt-4 text-sm text-gray-700 bg-gray-100 rounded-md dark:bg-zinc-700 dark:text-zinc-100">
                            Use this form to add a new instance of the Stacks Blockchain API. Make sure you review and trust the host before you add it.

                            <form className="mt-4">
                              <div className="flex flex-col">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
                                  Name
                                </label>
                                <div className="flex mt-1 rounded-md shadow-sm">
                                  <input
                                    value={networkName}
                                    onChange={onInputChange}
                                    type="text"
                                    name="networkName"
                                    id="networkName"
                                    className="flex-1 block w-full min-w-0 text-black border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col mt-3">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
                                  Address (include https://)
                                </label>
                                <div className="flex mt-1 rounded-md shadow-sm">
                                  <input
                                    value={networkAddress}
                                    onChange={onInputChange}
                                    type="text"
                                    name="networkAddress"
                                    id="networkAddress"
                                    className="flex-1 block w-full min-w-0 text-black border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col mt-3">
                                <label htmlFor="key" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
                                  Key
                                </label>
                                <div className="flex mt-1 rounded-md shadow-sm">
                                  <input
                                    value={networkKey}
                                    onChange={onInputChange}
                                    type="text"
                                    name="networkKey"
                                    id="networkKey"
                                    className="flex-1 block w-full min-w-0 text-black border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>

                              <button onClick={() => addNewNetwork()} className="flex items-center px-3 py-2 mt-5 text-sm font-medium leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Add network
                              </button>
                            </form>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>

                  <div className="px-4 py-6 mt-6 bg-indigo-700 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg text-white font-headings">
                        Transaction History
                      </Dialog.Title>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-indigo-300">
                        Your pending and confirmed transactions.
                      </p>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="relative flex-1 px-4 mt-6 sm:px-6">
                      <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                        <li className="py-4">
                          <div className="flex flex-col space-y-3">
                            <Placeholder width={Placeholder.width.FULL} />
                            <Placeholder width={Placeholder.width.THIRD} />
                            <Placeholder width={Placeholder.width.HALF} />
                          </div>
                        </li>
                        <li className="py-4">
                          <div className="flex flex-col space-y-3">
                            <Placeholder width={Placeholder.width.FULL} />
                            <Placeholder width={Placeholder.width.THIRD} />
                            <Placeholder width={Placeholder.width.HALF} />
                          </div>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="relative flex-1 px-4 mt-6 sm:px-6">
                      <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                        {pendingTransactions}
                        {transactions}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
