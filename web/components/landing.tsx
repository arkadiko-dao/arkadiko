import React from 'react';
import { useConnect } from '@stacks/connect-react';

export const Landing: React.FC = () => {
  const { doOpenAuth } = useConnect();
  const showWallet = process.env.REACT_APP_SHOW_CONNECT_WALLET === 'true';

  return (
    <div className="h-screen bg-white">
      <main>
        <div className="relative h-screen">
          <div className="absolute inset-x-0 bottom-0 bg-gray-100 h-1/2"></div>
          <div className="h-screen">
            <div className="relative h-screen shadow-xl sm:overflow-hidden">
              <div className="absolute inset-0 h-screen">
                <img className="object-cover w-full h-full" src="/assets/bridge2.jpg" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-indigo-700" style={{mixBlendMode: 'multiply'}}></div>
              </div>
              <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-64 lg:px-8">
                <h1 className="text-4xl font-bold tracking-tight text-center font-headings sm:text-5xl lg:text-6xl">
                  <span className="block text-white">Decentralised</span>
                  <span className="block text-indigo-200">Liquidity Protocol</span>
                </h1>
                <p className="max-w-lg mx-auto mt-6 text-xl text-center text-indigo-200 sm:max-w-3xl">
                  An open source and non-custodial liquidity protocol for minting stablecoins, earning interest on deposits and borrowing assets on Stacks.
                </p>
                <div className="max-w-sm mx-auto mt-10 sm:max-w-none sm:flex sm:justify-center">

                  {showWallet ? (
                    <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-1 sm:gap-5">
                      <a href="#" onClick={() => doOpenAuth()} className="flex items-center justify-center px-4 py-3 text-base font-medium text-indigo-700 bg-white border border-transparent rounded-md shadow-sm hover:bg-indigo-50 sm:px-8">
                        Connect Wallet
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                      <a href="https://github.com/arkadiko-dao/arkadiko/" target="_blank" className="flex items-center justify-center px-4 py-3 text-base font-medium text-indigo-700 bg-white border border-transparent rounded-md shadow-sm hover:bg-indigo-50 sm:px-8">
                        Learn more
                      </a>
                      <a href="https://forms.gle/3HSt7dNj92qEmXzf8" target="_blank" className="flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm bg-opacity-60 hover:bg-opacity-70 sm:px-8">
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
