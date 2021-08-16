import React, { useEffect, useState } from 'react';
import { getAccountTransactions, getPendingTransactions } from '@common/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { MempoolContractCallTransaction, ContractCallTransaction } from '@blockstack/stacks-blockchain-api-types';
import { ContractTransaction } from '@components/contract-transaction';

export const TxSidebar = ({ setShowSidebar }) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true"></div>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="w-screen max-w-md">
            <div className="flex flex-col h-full overflow-y-scroll bg-white shadow-xl">
              <div className="px-4 py-6 bg-indigo-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white font-headings">
                    Transaction History
                  </h2>
                  <div className="flex items-center ml-3 h-7">
                    <button
                      onClick={() => { setShowSidebar(false); }}
                      className="text-indigo-200 bg-indigo-700 rounded-md hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-sm text-indigo-300">
                    Your pending and confirmed transactions
                  </p>
                </div>
              </div>
              <div className="relative flex-1 px-4 py-6 sm:px-6">
                <div className="absolute inset-0 px-4 py-6 sm:px-6">
                  <div className="h-full" aria-hidden="true">
                    <ul className="divide-y divide-gray-200">
                      {pendingTransactions}
                      {transactions}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
