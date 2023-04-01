import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Tooltip } from '@blockstack/ui';
import { PoxTimelineIndicator } from './pox-timeline-indicator';

export const PoxTimeline = ({ unlockBurnHeight, vaultUnlockBurnHeight, currentBurnHeight, isLoading }) => {
  const [state, _] = useContext(AppContext);
  const startBurnHeight = unlockBurnHeight - 2100;
  const endBurnHeight = unlockBurnHeight;
  const firstCycle = state.cycleNumber + 1;

  return (
    <>
      {isLoading ? (
        <div className="flex w-full h-10 my-12 rounded-md bg-zinc-100 animate-pulse">
          <div className="flex items-center w-[75%]">
            <div className="w-1/3 h-full bg-gray-400/70 rounded-l-md" />
            <div className="w-1/3 h-full bg-gray-400/80" />
            <div className="w-1/3 h-full bg-gray-400/90" />
          </div>
          <div className="w-[25%] bg-gray-400 rounded-r-md" />
        </div>
      ) : (
        <div className="relative">
          <div className="flex w-full h-10 my-12 rounded-md bg-zinc-100">
            <div className="flex items-center font-semibold justify-center text-xs text-center w-[75%]">
              <div className="relative flex items-center justify-center w-3/3 h-full text-xs font-semibold text-white bg-indigo-600/70 rounded-l-md">
                Current Cycle (#{firstCycle})
                <PoxTimelineIndicator
                  position="transform -translate-x-1/2 left-3/4 -top-11"
                  reversed={true}
                  arrow="rotate-180 -scale-x-100"
                  label="We are here"
                  link={`https://mempool.space/`}
                  block={currentBurnHeight}
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
              <Tooltip label={`2-week period`}>Unstacked</Tooltip>
            </div>
          </div>

          <PoxTimelineIndicator
            label="Start"
            link={`https://mempool.space/block/${startBurnHeight}`}
            block={startBurnHeight}
          />
        </div>
      )}
    </>
  );
};
