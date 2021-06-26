import React, { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { CogIcon, InformationCircleIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';

export const SwapSettings: React.FC = ({ slippageTolerance, setDefaultSlippage, setSlippageTolerance }) => {
  const onInputChange = (event: { target: { name: any; value: any; }; }) => {
    const value = event.target.value;
    setSlippageTolerance(value);
  };

  return (
    <div className="">
      <Popover className="relative">
        {() => (
          <>
            <Popover.Button
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
              id="open-transaction-settings"
            >
              <span className="sr-only">Swap transation settings</span>
              <CogIcon
                className="h-6 w-6 hover:text-gray-500 transition ease-in-out duration-150"
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute max-w-sm mt-3 px-4 right-0 sm:px-0 w-screen z-20">
                <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative bg-white p-4">
                    <div className="inline-flex items-center">
                      <h4 className="text-base leading-6 font-medium text-gray-900">
                        Slippage Tolerance
                      </h4>
                      <div className="ml-2">
                        <Tooltip className="z-10" shouldWrapChildren={true} label={`Your transaction will revert if the price changes unfavorably by more of this percentage`}>
                          <InformationCircleIcon className="block h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {slippageTolerance !== 0.4 ? (
                        <button
                          type="button"
                          onClick={setDefaultSlippage}
                          className="text-grey inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm focus:ring-indigo-500"
                        >
                          Auto
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={setDefaultSlippage}
                          className="text-white bg-indigo-600 inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm focus:ring-indigo-500"
                        >
                          Auto
                        </button>
                      )}
                    
                      <div className="relative rounded-md shadow-sm flex-1 ml-2">
                        <input 
                          type="number" 
                          inputMode="decimal" 
                          autoComplete="off" 
                          autoCorrect="off" 
                          id="slippageTolerance"
                          name="slippageTolerance" 
                          pattern="^[0-9]*[.,]?[0-9]*$" 
                          placeholder="0.10"
                          value={slippageTolerance}
                          onChange={onInputChange}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-8 sm:text-sm border-gray-300 rounded-md text-right" />
                        <div className="absolute inset-y-0 right-0 w-8 flex items-center justify-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  )
}


