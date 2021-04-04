import React from 'react';
import { useConnect } from '@stacks/connect-react';

export const Landing: React.FC = () => {
  const { doOpenAuth } = useConnect();
  const env = process.env.REACT_APP_NETWORK_ENV;
  const isMockNet = env == 'mocknet';

  return (
    <div className="bg-white h-screen">
      <main>
        <div className="relative h-screen">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100"></div>
          <div className="h-screen">
            <div className="relative shadow-xl sm:overflow-hidden h-screen">
              <div className="absolute inset-0 h-screen">
                <img className="h-full w-full object-cover" src="/assets/bridge2.jpg" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-indigo-700" style={{mixBlendMode: 'multiply'}}></div>
              </div>
              <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-64 lg:px-8">
                <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">Decentralised</span>
                  <span className="block text-indigo-200">Liquidity Protocol</span>
                </h1>
                <p className="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
                  An open source and non-custodial liquidity protocol for minting stablecoins, earning interest on deposits and borrowing assets on Stacks.
                </p>
                <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">

                  {isMockNet ? (
                    <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-1 sm:gap-5">
                      <a href="#" onClick={() => doOpenAuth()} className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 sm:px-8">
                        Connect Wallet
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                      <a href="https://github.com/philipdesmedt/arkadiko-dao/" target="_blank" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 sm:px-8">
                        Learn more
                      </a>
                      <a href="https://forms.gle/3HSt7dNj92qEmXzf8" target="_blank" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 sm:px-8">
                        Participate
                      </a>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
