import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { classNames } from '@common/class-names';
import { InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/solid';
import { Tooltip } from '@blockstack/ui';
import { Disclosure } from '@headlessui/react';
import { tokenList } from '@components/token-swap-list';
import { NavLink as RouterLink } from 'react-router-dom';
import { tokenTraits } from '@common/vault-utils';
import { callReadOnlyFunction, cvToJSON, contractPrincipalCV, standardPrincipalCV } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { Alert } from './alert';

export const PoolPosition: React.FC = ({ indexTokenX, indexTokenY }) => {
  const tokenX = tokenList[indexTokenX];
  const tokenY = tokenList[indexTokenY];
  const tokenXTrait = tokenTraits[tokenX['name'].toLowerCase()]['swap'];
  const tokenYTrait = tokenTraits[tokenY['name'].toLowerCase()]['swap'];
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const stxAddress = useSTXAddress();

  const [state] = useContext(AppContext);
  const [tokenPair, setTokenPair] = useState('');
  const [pooledX, setPooledX] = useState(0.0);
  const [pooledY, setPooledY] = useState(0.0);
  const [totalShare, setTotalShare] = useState(0);
  const [stakedLpTokens, setStakedLpTokens] = useState(0);

  useEffect(() => {
    const fetchPair = async (tokenXContract:string, tokenYContract:string) => {
      let details = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-swap-v1-1",
        functionName: "get-pair-details",
        functionArgs: [
          contractPrincipalCV(contractAddress, tokenXContract),
          contractPrincipalCV(contractAddress, tokenYContract)
        ],
        senderAddress: stxAddress || '',
        network: network,
      });

      return cvToJSON(details);
    };

    const fetchStakedTokens = async (poolName:string) => {

      var poolContract = "";
      if (poolName == "wSTX-DIKO") {
        poolContract = "arkadiko-stake-pool-wstx-diko-v1-1";
      } else if (poolName == "wSTX-USDA") {
        poolContract = "arkadiko-stake-pool-wstx-usda-v1-1";
      }  else if (poolName == "DIKO-USDA") {
        poolContract = "arkadiko-stake-pool-diko-usda-v1-1";
      } 
      if (poolContract == "") {
        return 0;
      }

      const userLpDikoUsdaStakedCall = await callReadOnlyFunction({
        contractAddress,
        contractName: poolContract,
        functionName: "get-stake-amount-of",
        functionArgs: [
          standardPrincipalCV(stxAddress || '')
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      return cvToJSON(userLpDikoUsdaStakedCall).value;
    };

    const resolvePair = async () => {
      const json3 = await fetchPair(tokenXTrait, tokenYTrait);
      if (json3['success']) {

        const stakedTokens = await fetchStakedTokens(json3['value']['value']['value']['name'].value)
        setStakedLpTokens(stakedTokens);

        const balanceX = json3['value']['value']['value']['balance-x'].value;
        const balanceY = json3['value']['value']['value']['balance-y'].value;

        const tokenPair = `${tokenX.nameInPair.toLowerCase()}${tokenY.nameInPair.toLowerCase()}`
        const totalTokens = json3['value']['value']['value']['shares-total'].value;
        const tokenXYBalance = Number(state.balance[tokenPair]) + Number(stakedTokens);
        let totalShare = Number(((tokenXYBalance / totalTokens) * 100).toFixed(3));
        if (!tokenXYBalance) {
          totalShare = 0;
        }
        if (totalShare > 100) {
          totalShare = 100;
        }

        setTokenPair(tokenPair);

        setPooledX((balanceX / 1000000) * totalShare / 100);
        setPooledY((balanceY / 1000000) * totalShare / 100);

        if (totalShare > 100) {
          setTotalShare(100);
        } else {
          setTotalShare(totalShare);
        }
        
      }
    };

    resolvePair();
  }, [tokenX, tokenY, state.balance]);

  return (
    <Disclosure as="div" key={''} className="">
      {({ open }) => (
        <>
          <dt className="text-lg">
            <Disclosure.Button className="flex items-start justify-between w-full text-left text-gray-400">
              <div className="flex items-center">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
                    src={tokenX.logo}
                    alt=""
                  />
                  <img
                    className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
                    src={tokenY.logo}
                    alt=""
                  />
                </div>
                <p className="ml-2 text-base text-gray-800">{tokenX.name}/{tokenY.name}</p>
              </div>
              <span className="flex items-center ml-6 h-7">
                <ChevronDownIcon
                  className={classNames(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform')}
                  aria-hidden="true"
                />
              </span>
            </Disclosure.Button>
          </dt>
          <Disclosure.Panel as="dd" className="mt-2">
            <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50">
              <h4 className="text-xs text-indigo-700 uppercase font-headings">Pool share</h4>

              <dl className="mt-2 space-y-1">
                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                    Available pool tokens
                    <div className="ml-2">
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`Indicates the total amount of LP tokens you have in your wallet`}>
                        <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                      </Tooltip>
                    </div>
                  </dt>
                  <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                    {state.balance[tokenPair] > 0 ? (
                      `${state.balance[tokenPair] / 1000000}`
                    ) : 0 }
                  </dt>
                </div>
                
                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                    Staked pool tokens
                    <div className="ml-2">
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`Indicates the total amount of LP tokens you have staked`}>
                        <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                      </Tooltip>
                    </div>
                  </dt>
                  <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                    {stakedLpTokens > 0 ? (
                      `${stakedLpTokens / 1000000}`
                    ) : 0 }
                  </dt>
                </div>
              </dl>

              <dl className="mt-4 space-y-1">
                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                    Your pool share
                    <div className="ml-2">
                      <Tooltip className="z-10" shouldWrapChildren={true} label={`The percentual share of LP tokens you own agains the whole pool supply`}>
                        <InformationCircleIcon className="block w-4 h-4 text-indigo-400" aria-hidden="true" />
                      </Tooltip>
                    </div>
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                    {totalShare}%
                  </dd>
                </div>
                
                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                    Pooled {tokenX.name}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                    {pooledX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </dd>
                </div>
                
                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                  <dt className="inline-flex items-center text-sm font-medium text-indigo-500">
                    Pooled {tokenY.name}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                    {pooledY.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}                    
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4">
              <Alert>
                <p>
                  In order to remove liquidity and make the LP tokens available again, keep in mind that you must first <RouterLink
                    className="font-semibold text-blue-700 underline whitespace-nowrap hover:text-blue-600"
                    to={'/stake'}
                  >
                    unstake them
                  </RouterLink>.
                </p>
              </Alert>
            </div>

            <div className="mt-4 sm:grid sm:grid-cols-2 sm:gap-2 sm:grid-flow-row-dense">
              <RouterLink
                className="inline-flex justify-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-md shadow-sm bg-white-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                to={`swap/remove/${tokenX.name}/${tokenY.name}`}
              >
                Remove
              </RouterLink>
              <RouterLink
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                to={`swap/add/${tokenX.name}/${tokenY.name}`}
              >
                Add
              </RouterLink>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
