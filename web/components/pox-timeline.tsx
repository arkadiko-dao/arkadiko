import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Tooltip } from '@blockstack/ui';
import { Placeholder } from './ui/placeholder';
import { PoxTimelineIndicator } from './pox-timeline-indicator';

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
                  <PoxTimelineIndicator
                    position="transform -translate-x-1/2 left-3/4 -top-11"
                    reversed={true}
                    arrow="rotate-180 -scale-x-100"
                    label="We are here"
                    link={`https://mempool.space/`}
                    block={currentBurnHeight}
                  />
                ) : null}
              </div>
              <div className="relative flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/80">
                Cycle 2 (#{firstCycle + 1})

                {currentIndex === 1 ? (
                  <PoxTimelineIndicator
                    position="transform -translate-x-1/2 left-3/4 -top-11"
                    reversed={true}
                    arrow="rotate-180 -scale-x-100"
                    label="We are here"
                    link={`https://mempool.space/`}
                    block={currentBurnHeight}
                  />
                ) : null}
              </div>
              <div className="relative flex items-center justify-center w-1/3 h-full text-xs font-semibold text-white bg-indigo-600/90">
                Cycle 3 (#{firstCycle + 2})

                {currentIndex === 2 ? (
                  <PoxTimelineIndicator
                    position="transform -translate-x-1/2 left-3/4 -top-11"
                    reversed={true}
                    arrow="rotate-180 -scale-x-100"
                    label="We are here"
                    link={`https://mempool.space/`}
                    block={currentBurnHeight}
                  />
                ) : null}

                <PoxTimelineIndicator
                  position="-right-2 top-11"
                  arrow="order-1 w-4 h-4 mr-1 -scale-x-100"
                  label="Finish"
                  link={`https://mempool.space/`}
                  block={unlockBurnHeight}
                />
              </div>
            </div>
            <div className="relative flex text-white items-center font-semibold justify-center text-xs text-center w-[25%] bg-indigo-800 hover:cursor-help rounded-r-md">
              {currentIndex === 3 ? (
                <PoxTimelineIndicator
                  position="transform -translate-x-1/2 left-3/4 -top-11"
                  reversed={true}
                  arrow="rotate-180 -scale-x-100"
                  label="We are here"
                  link={`https://mempool.space/`}
                  block={currentBurnHeight}
                />
              ) : null}
              <Tooltip
                label={`2-week period`}
              >
                Cooldown
              </Tooltip>
            </div>
          </div>

          <PoxTimelineIndicator
            label="Start"
            link={`https://mempool.space/block/${state.cycleStartHeight}`}
            block={startBurnHeight}
          />
        </div>
      )}
    </>
  )
};
