import React, { useEffect, useState } from 'react';
import { getAccountTransactions, getPendingTransactions } from '@common/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { MempoolContractCallTransaction, ContractCallTransaction } from '@blockstack/stacks-blockchain-api-types';
import { ContractTransaction } from '@components/contract-transaction';

export const TxSidebar = ({ setShowSidebar }) => {
  const address = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [transactions, setTransactions] = useState<ContractCallTransaction[]>();
  const [pendingTransactions, setPendingTransactions] = useState<MempoolTransaction[]>();

  useEffect(() => {
    let mounted = true;

    const fetchTransations = async () => {
      if (mounted) {
        const txs = await getAccountTransactions(address || '', contractAddress || '');
        let index = 0;
        const txMap = txs.map((tx: ContractCallTransaction) => {
          index += 1;
          return <ContractTransaction
            key={index}
            transaction={tx}
            status='success'
          />
        });

        setTransactions(txMap);
        const pending = await getPendingTransactions(contractAddress || '');
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
    <div className="fixed inset-0 overflow-hidden z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true"></div>

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="py-6 px-4 bg-indigo-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">
                    Transaction History
                  </h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      onClick={() => { setShowSidebar(false); }}
                      className="bg-indigo-700 rounded-md text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
              <div className="relative flex-1 py-6 px-4 sm:px-6">
                <div className="absolute inset-0 py-6 px-4 sm:px-6">
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
