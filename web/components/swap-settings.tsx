import React, { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { CogIcon, InformationCircleIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';
import { classNames } from '@common/class-names';

interface Props {
  slippageTolerance: number;
  setDefaultSlippage: () => void;
  setSlippageTolerance: (arg0: number) => void;
}

export const SwapSettings: React.FC<Props> = ({
  slippageTolerance,
  setDefaultSlippage,
  setSlippageTolerance,
}) => {
  const onInputChange = (event: { target: { name: any; value: any } }) => {
    const value = event.target.value;
    setSlippageTolerance(value);
  };

  return (
    <Popover className="relative">
      {() => (
        <>
          <Popover.Button
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            id="open-transaction-settings"
          >
            <span className="sr-only">Swap transation settings</span>
            <CogIcon
              className="w-6 h-6 text-gray-400 transition duration-150 ease-in-out hover:text-indigo-700 dark:hover:text-indigo-400"
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
            <Popover.Panel className="absolute right-0 z-20 w-screen max-w-sm px-4 mt-3 sm:px-0">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="relative p-4 bg-white dark:bg-zinc-900">
                  <div className="inline-flex items-center">
                    <h4 className="text-base font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                      Slippage Tolerance
                    </h4>
                    <div className="ml-2">
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`Your transaction will revert if the price changes unfavorably by more of this percentage`}
                      >
                        <InformationCircleIcon
                          className="block w-5 h-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <button
                      type="button"
                      onClick={setDefaultSlippage}
                      className={classNames(
                        slippageTolerance !== 4
                          ? 'border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50'
                          : 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200',
                        'inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      )}
                    >
                      Auto
                    </button>

                    <div className="relative flex-1 ml-2 rounded-md shadow-sm">
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
                        min={0}
                        className="block w-full pr-8 text-right border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-8 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
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
  );
};
