import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { XIcon } from '@heroicons/react/outline';

export const TxStatus = () => {
  const [state, setState] = useContext(AppContext);

  const statusClass = () => {
    if (state.currentTxStatus === 'success') {
      return 'text-green-500';
    } else if (state.currentTxStatus === 'pending') {
      return 'text-gray-500';
    }

    return 'text-red-500';
  };

  return (
    <div className="hidden sm:block">
      {state.currentTxId || state.showTxModal ? (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end" style={{zIndex: 99999}}>
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setState(prevState => ({...prevState, currentTxId: null }))}
                  >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    Successfully broadcasted transaction!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Status: {state.currentTxStatus}
                  </p>
                  {state.currentTxMessage ? (
                    <p className={`mt-1 text-sm ${statusClass()}`}>
                      {state.currentTxMessage}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      This page will be updated automatically when the transaction succeeds.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null }
    </div>
  );
};
