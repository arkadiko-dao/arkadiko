import React, { Fragment, useContext } from 'react';
import { AppContext } from '@common/context';
import { Transition } from '@headlessui/react';
import { ExplorerLink } from './explorer-link';
import { StyledIcon } from './ui/styled-icon';

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
      currentTxId: null,
    }));
  };

  return (
    <>
      <div
        aria-live="assertive"
        className="fixed inset-0 z-50 flex items-end px-4 py-6 mt-16 pointer-events-none sm:p-6 sm:items-start"
      >
        <div className="flex flex-col items-center w-full space-y-4 sm:items-end">
          {state.currentTxId || state.showTxModal ? (
            <Transition
              show={state.showTxModal || state.currentTxId !== undefined}
              as={Fragment}
              enter="transform ease-out duration-300 transition"
              enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
              enterTo="translate-y-0 opacity-100 sm:translate-x-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5">
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <StyledIcon
                        as="CheckCircleIcon"
                        size={6}
                        solid={false}
                        className="text-green-400"
                      />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-gray-900">
                        Successfully broadcasted transaction!
                      </p>
                      {state.currentTxStatus !== 'success' ? (
                        <p className="mt-1 text-sm text-gray-500">
                          Status: {state.currentTxStatus}
                        </p>
                      ) : null}

                      <div className="my-4">
                        <ExplorerLink
                          txId={state.currentTxId}
                          className="text-sm font-medium text-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                        />
                      </div>

                      {state.currentTxMessage ? (
                        <p className={`mt-1 text-sm ${statusClass()}`}>{state.currentTxMessage}</p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          This page will be updated automatically when the transaction succeeds.
                        </p>
                      )}
                    </div>
                    <div className="flex ml-4 shrink-0">
                      <button
                        className="inline-flex text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          hidePopup();
                        }}
                      >
                        <span className="sr-only">Close</span>
                        <StyledIcon as="XIcon" size={5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          ) : null}
        </div>
      </div>
    </>
  );
};
