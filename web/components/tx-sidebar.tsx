import React, { Fragment, useEffect,useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { getAccountTransactions, getPendingTransactions } from '@common/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { MempoolContractCallTransaction, ContractCallTransaction } from '@blockstack/stacks-blockchain-api-types';
import { ContractTransaction } from '@components/contract-transaction';

export const TxSidebar = ({ showSidebar, setShowSidebar }) => {
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [transactions, setTransactions] = useState<JSX.Element[]>();
  const [pendingTransactions, setPendingTransactions] = useState<JSX.Element[]>();

  useEffect(() => {
    let mounted = true;

    const fetchTransations = async () => {
      if (mounted) {
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
          return <ContractTransaction
            key={index}
            transaction={tx}
            status={status}
          />
        });

        setTransactions(txMap);
        const pending = await getPendingTransactions(address || '', contractAddress || '');
        const pendingMap = pending.map((tx: MempoolContractCallTransaction) => {
          index += 1;
          return <ContractTransaction
            key={index}
            transaction={tx}
            status='pending'
          />
        });
        setPendingTransactions(pendingMap);
      }
    };

    fetchTransations();
    return () => { mounted = false; }
  }, []);

  return (
    <Transition show={showSidebar} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" onClose={() => { setShowSidebar(false); }}>
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
                <div className="flex flex-col h-full overflow-y-scroll bg-white shadow-xl">
                  <div className="px-4 py-6 bg-indigo-700 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg text-white font-headings">Transaction History</Dialog.Title>
                      <div className="flex items-center ml-3 h-7">
                        <button
                          type="button"
                          className="text-indigo-200 bg-indigo-700 rounded-md hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={() => { setShowSidebar(false); }}
                        >
                          <span className="sr-only">Close panel</span>
                          <XIcon className="w-6 h-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-indigo-300">
                        Your pending and confirmed transactions.
                      </p>
                    </div>
                  </div>
                  <div className="relative flex-1 px-4 mt-6 sm:px-6">
                    <ul className="divide-y divide-gray-200">
                      {pendingTransactions}
                      {transactions}
                    </ul>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
