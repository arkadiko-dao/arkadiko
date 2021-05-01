import React, { useContext } from 'react';
import { AppContext } from '@common/context';

export const TxStatus = () => {
  const [state, _] = useContext(AppContext);

  return (
    <div className="hidden sm:block">
      {state.currentTxId ? (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end" style={{zIndex: 99999}}>
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
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
                    <p className="mt-1 text-sm text-red-500">
                      {state.currentTxMessage}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      This page will be reloaded automatically when the transaction succeeds.
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
