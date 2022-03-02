import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Tooltip } from '@blockstack/ui';
import { Placeholder } from './ui/placeholder';

export const PoxTimeline = ({ unlockBurnHeight, currentBurnHeight, isLoading }) => {
  const [state, _] = useContext(AppContext);

  const startBurnHeight = unlockBurnHeight - 3 * 2100;
  let currentIndex = 3; // cooldown
  if (unlockBurnHeight > currentBurnHeight) {
    currentIndex = Math.floor(((unlockBurnHeight - currentBurnHeight) / 2100) - 2);
  }
  let firstCycle = state.cycleNumber + 1;
  if (currentIndex !== 3) {
    firstCycle = (startBurnHeight - 100) === state.cycleStartHeight ? state.cycleNumber : state.cycleNumber + currentIndex;
  }

  return (
    <>
      {isLoading ? (
        <div className="p-4 border-l-4 border-gray-400 rounded-tr-md rounded-br-md bg-gray-50 dark:bg-gray-200">
          <div className="flex">
            <div className="w-5 h-5 bg-gray-300 rounded-full shrink-0" />
            <div className="flex-1 ml-3">
              <Placeholder className="py-2" color={Placeholder.color.GRAY} width={Placeholder.width.HALF} />
              <Placeholder className="py-2" color={Placeholder.color.GRAY} width={Placeholder.width.THIRD} />
              <Placeholder className="py-2" color={Placeholder.color.GRAY} width={Placeholder.width.FULL} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="flex w-full h-10 my-12 rounded-md bg-zinc-100">
            <div className="flex items-center font-semibold justify-center text-xs text-center w-[75%]">
              <div className="relative flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/70 rounded-l-md">
                Cycle 1 (#{firstCycle})

                {currentIndex === 0 ? (
                  <div className="absolute flex flex-col items-start justify-start transform -translate-x-1/2 cursor-help whitespace-nowrap left-1/2 -top-11">
                    <div className="flex items-center order-1 mt-1 text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-1 rotate-180 -scale-x-100" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
                      </svg>
                      <div className="text-xs font-semibold">We are here</div>
                    </div>
                    <a href={`https://mempool.space/`} target="_blank" rel="noopener noreferrer" className="font-normal hover:underline text-xs mt-0.5 ml-1 text-gray-500 dark:text-gray-200">#{currentBurnHeight}</a>
                  </div>
                ) : null}
              </div>
              <div className="relative flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/80">
                Cycle 2 (#{firstCycle + 1})

                {currentIndex === 1 ? (
                  <div className="absolute flex flex-col items-start justify-start transform -translate-x-1/2 cursor-help whitespace-nowrap left-1/2 -top-11">
                    <div className="flex items-center order-1 mt-1 text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-1 rotate-180 -scale-x-100" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
                      </svg>
                      <div className="text-xs font-semibold">We are here</div>
                    </div>
                    <a href={`https://mempool.space/`} target="_blank" rel="noopener noreferrer" className="font-normal hover:underline text-xs mt-0.5 ml-1 text-gray-500 dark:text-gray-200">#{currentBurnHeight}</a>
                  </div>
                ) : null}
              </div>
              <div className="relative flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/90">
                Cycle 3 (#{firstCycle + 2})

                {currentIndex === 2 ? (
                  <div className="absolute flex flex-col items-start justify-start transform -translate-x-1/2 cursor-help whitespace-nowrap left-1/2 -top-11">
                    <div className="flex items-center order-1 mt-1 text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-1 rotate-180 -scale-x-100" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
                      </svg>
                      <div className="text-xs font-semibold">We are here</div>
                    </div>
                    <a href={`https://mempool.space/`} target="_blank" rel="noopener noreferrer" className="font-normal hover:underline text-xs mt-0.5 ml-1 text-gray-500 dark:text-gray-200">#{currentBurnHeight}</a>
                  </div>
                ) : null}

                <div className="absolute flex flex-col items-start justify-start cursor-help -right-2 top-11">
                  <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                    <svg className="order-1 w-4 h-4 mr-1 -scale-x-100" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
                    </svg>
                    <div className="text-xs font-semibold">Finish</div>
                  </div>
                  <a href="https://mempool.space/" target="_blank" rel="noopener noreferrer" className="font-normal hover:underline text-xs mt-0.5 mr-1 text-gray-500 dark:text-gray-200">#{unlockBurnHeight}</a>
                </div>
              </div>
            </div>
            <div className="flex text-white items-center font-semibold justify-center text-xs text-center w-[25%] bg-indigo-800 hover:cursor-help rounded-r-md">
              {currentIndex === 3 ? (
                <div className="relative flex flex-col items-start justify-start transform -translate-x-1/2 cursor-help whitespace-nowrap left-1/2 -top-11">
                  <div className="flex items-center order-1 mt-1 text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4 mr-1 rotate-180 -scale-x-100" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
                    </svg>
                    <div className="text-xs font-semibold">We are here</div>
                  </div>
                  <a href={`https://mempool.space/`} target="_blank" rel="noopener noreferrer" className="font-normal hover:underline text-xs mt-0.5 ml-1 text-gray-500 dark:text-gray-200">#{currentBurnHeight}</a>
                </div>
              ) : null}
              <Tooltip
                label={`2-week period`}
              >
                Cooldown
              </Tooltip>
            </div>
          </div>

          <div className="absolute flex flex-col items-start justify-start cursor-help -left-1 top-11">
            <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
              </svg>
              <div className="text-xs font-semibold">Start</div>
            </div>
            <a href={`https://mempool.space/block/${state.cycleStartHeight}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-xs mt-0.5 ml-1 text-gray-500 dark:text-gray-200">#{startBurnHeight}</a>
          </div>
        </div>
      )}
    </>
  )
};
