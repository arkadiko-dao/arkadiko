import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { classNames } from '@common/class-names';
import { StyledIcon } from './ui/styled-icon';

export const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
export const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
export const welshContractAddress = process.env.WELSH_CONTRACT_ADDRESS || '';
export const ldnContractAddress = process.env.LDN_CONTRACT_ADDRESS || '';
export const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS
export const xusdContractAddress = process.env.XUSD_CONTRACT_ADDRESS || '';

export const tokenList = [
  {
    id: 1,
    name: 'USDA',
    nameInPair: 'usda',
    logo: '/assets/tokens/usda.svg',
    listed: true,
    address: contractAddress,
    fullName: 'usda-token',
    decimals: 6
  },
  {
    id: 2,
    name: 'DIKO',
    nameInPair: 'diko',
    logo: '/assets/tokens/diko.svg',
    listed: true,
    address: contractAddress,
    fullName: 'arkadiko-token',
    decimals: 6
  },
  {
    id: 3,
    name: 'STX',
    nameInPair: 'wstx',
    logo: '/assets/tokens/stx.svg',
    listed: true,
    address: contractAddress,
    fullName: 'wrapped-stx-token',
    decimals: 6
  },
  {
    id: 4,
    name: 'xBTC',
    nameInPair: 'xbtc',
    logo: '/assets/tokens/xbtc.svg',
    listed: true,
    address: xbtcContractAddress,
    fullName: 'Wrapped-Bitcoin',
    decimals: 8,
  },
  {
    id: 5,
    name: 'wLDN',
    nameInPair: 'wldn',
    logo: '/assets/tokens/lydian.svg',
    listed: false,
    address: ldnContractAddress,
    fullName: 'wrapped-lydian-token',
    decimals: 6
  },
  {
    id: 6,
    name: 'LDN',
    nameInPair: 'ldn',
    logo: '/assets/tokens/lydian.svg',
    listed: true,
    address: ldnContractAddress,
    fullName: 'lydian-token',
    decimals: 6
  },
  {
    id: 7,
    name: 'WELSH',
    nameInPair: 'welsh',
    logo: '/assets/tokens/welsh.png',
    listed: true,
    address: welshContractAddress,
    fullName: 'welshcorgicoin-token',
    decimals: 6
  },
  {
    id: 8,
    name: 'atALEX',
    nameInPair: 'auto-alex',
    logo: '/assets/tokens/atalex.png',
    listed: false,
    address: atAlexContractAddress,
    fullName: 'auto-alex',
    decimals: 8
  },
  {
    id: 9,
    name: 'xUSD',
    nameInPair: 'xUSD',
    logo: '/assets/tokens/xusd.svg',
    listed: false,
    address: xusdContractAddress,
    fullName: 'Wrapped-USD',
    decimals: 8,
  },
];

type Token = {
  id: number;
  name: string;
  nameInPair: string;
  logo: string;
  listed: boolean;
};
interface Props {
  selected: Token;
  setSelected(selected: Token): void;
  disabled?: boolean;
}

export const TokenSwapList: React.FC<Props> = ({ selected, setSelected, disabled }) => {
  return (
    <Listbox value={selected} onChange={setSelected} disabled={disabled}>
      {({ open }) => (
        <>
          <div className="relative flex-1">
            <Listbox.Button
              className={`relative w-full py-2 pl-3 ${
                disabled ? 'pr-3' : 'pr-10'
              } text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-default md:w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-900`}
            >
              <span className="flex items-center">
                <img src={selected.logo} alt="" className="w-6 h-6 rounded-full shrink-0" />
                <span className="block ml-3 truncate dark:text-zinc-50">{selected.name}</span>
              </span>
              {!disabled ? (
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 ml-3 pointer-events-none">
                  <StyledIcon as="SelectorIcon" size={5} className="text-gray-400" />
                </span>
              ) : null}
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                static
                className="absolute z-20 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg dark:text-zinc-50 dark:bg-zinc-800 max-h-56 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              >
                {tokenList
                  .filter(token => token.listed)
                  .map(token => (
                    <Listbox.Option
                      key={token.id}
                      className={({ active }) =>
                        classNames(
                          active ? 'text-white bg-indigo-600' : 'text-gray-900',
                          'cursor-default select-none relative py-2 pl-3 pr-9'
                        )
                      }
                      value={token}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            <img
                              src={token.logo}
                              alt=""
                              className="w-6 h-6 rounded-full shrink-0"
                            />
                            <span
                              className={classNames(
                                selected ? 'font-semibold' : 'font-normal',
                                'ml-3 block truncate dark:text-zinc-50'
                              )}
                            >
                              {token.name}
                            </span>
                          </div>

                          {selected ? (
                            <span
                              className={classNames(
                                active ? 'text-white' : 'text-indigo-600',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                              )}
                            >
                              <StyledIcon as="CheckIcon" size={5} />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};
