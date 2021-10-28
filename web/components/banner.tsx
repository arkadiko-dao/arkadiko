import React from 'react';
import { ExclamationIcon } from '@heroicons/react/outline'

export const Banner = () => {
  return (
    <div className="bg-yellow-50">
      <div className="px-3 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center flex-1 w-0">
            <span className="flex p-2 bg-yellow-100 rounded-lg">
              <ExclamationIcon className="w-6 h-6 text-yellow-400" aria-hidden="true" />
            </span>
            <p className="ml-3 text-yellow-700 truncate">
              <span className="md:hidden">Announcement</span>
              <span className="hidden md:inline">Arkadiko was hit by an exploit. Swap is disabled until further notice.</span>
            </p>
          </div>
          <div className="flex-shrink-0 order-3 w-full mt-2 sm:order-2 sm:mt-0 sm:w-auto">
            <a
              href="https://arkadikofinance.medium.com/arkadiko-swap-post-mortem-f38cef95ff28"
              className="bg-yellow-100 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
