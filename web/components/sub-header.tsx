import React from 'react';
import { Disclosure } from '@headlessui/react';
import { StyledIcon } from './ui/styled-icon';
import { Balances } from './balances';

export const SubHeader: React.FC = () => {
  return (
    <>
      <div className="w-full sm:hidden">
        <div className="w-full p-2 mx-auto bg-indigo-500 dark:bg-indigo-300">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-indigo-900 rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-200 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                  <span className="mr-6 text-xs font-semibold text-white uppercase dark:text-indigo-600">Balances</span>
                  <StyledIcon
                    as="ChevronUpIcon"
                    size={5}
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-white dark:text-indigo-600`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                  <p className="text-white dark:text-indigo-600">
                    <Balances />
                  </p>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      </div>
      <div className="relative hidden bg-indigo-500 sm:block dark:bg-indigo-300">
        <div className="px-3 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="pr-16 sm:text-center sm:px-16">
            <p className="text-white dark:text-indigo-600">
              <span className="mr-6 text-xs font-semibold uppercase">Balances:</span>
              <Balances />
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
