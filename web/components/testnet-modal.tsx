import React, { useEffect, useState } from 'react';
import { Modal } from '@blockstack/ui';

export const TestnetModal = () => {
  const [showTestnetModal, setShowTestnetModal] = useState(false);
  const env = process.env.REACT_APP_NETWORK_ENV;

  useEffect(() => {
    const hideModal = localStorage.getItem('arkadiko-hide-testnet-modal');
    setShowTestnetModal(!!!hideModal);
  }, []);

  const hideTestnetModal = () => {
    localStorage.setItem('arkadiko-hide-testnet-modal', 'true');
    setShowTestnetModal(false);
  };

  return (
    <div>
      {env === 'regtest' || env === 'testnet' ? (
        <Modal isOpen={showTestnetModal}>
          <div className="flex p-4 text-center sm:block sm:p-0">
            <div className="inline-block w-24 w-full max-w-sm px-2 pt-5 pb-4 overflow-hidden text-left align-middle align-bottom bg-white rounded-lg sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
              <div>
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">
                    Welcome to Arkadiko Regtest!
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-left text-gray-500">
                      The regtest launch is a functional equivalent to mainnet, which will be launched later this year.
                      The purpose of regtest is to work out small bugs and issues that will enhance the user experience on mainnet.
                      Regtest does not use any real money, so you are open to play around!
                      You can request some regtest STX tokens on the Mint tab in case you need some.
                    </p>
                    <p className="mt-2 text-sm text-left text-gray-500">
                      What we have in store:
                    </p>
                    <ul className="pl-4 my-2 text-sm text-left text-gray-500 list-disc">
                      <li>Create vaults and mint USDA with two collateral types: STX-A and STX-B</li>
                      <li>Swap USDA/DIKO and USDA/STX</li>
                      <li>Buy up collateral in liquidated vault auctions</li>
                      <li>Earn DIKO vault rewards</li>
                      <li>Stake your DIKO governance tokens to earn extra DIKO</li>
                    </ul>
                    <p className="mt-2 text-sm text-left text-gray-500">
                      Happy testing!
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button type="button" onClick={() => hideTestnetModal()} className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null }
    </div>
  );
};
