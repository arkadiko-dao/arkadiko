import React, { Fragment, useContext } from 'react';
import { AppContext } from '@common/context';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/outline';
import { XIcon } from '@heroicons/react/solid';

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

  const hidePopup = () => {
    setState(prevState => ({
      ...prevState,
      showTxModal: false,
      currentTxId: null
    }));
  };

  return (
    <>
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50 mt-16">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {state.currentTxId || state.showTxModal ? (
            <Transition
              show={state.showTxModal}
              as={Fragment}
              enter="transform ease-out duration-300 transition"
              enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
              enterTo="translate-y-0 opacity-100 sm:translate-x-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
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
                    <div className="ml-4 flex-shrink-0 flex">
                      <button
                        className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {hidePopup()}}>
                        <span className="sr-only">Close</span>
                        <XIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          ) : null }
          </div>
      </div>
    </>
  );
};
