import React from 'react';
import { stacksNetwork as network } from '@common/utils';
import { makeContractCall } from '@common/contract-call';
import { useSTXAddress } from '@common/use-stx-address';
import {
  uintCV,
  contractPrincipalCV,
  stringAsciiCV,
  standardPrincipalCV,
  fetchCallReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';

export const Admin = () => {
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const exec = async () => {
    await makeContractCall(
      {
        stxAddress: stxAddress,
        contractAddress: contractAddress,
        contractName: "arkadiko-vaults-tokens-v1-1",
        functionName: "set-token",
        functionArgs: [
          contractPrincipalCV('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4', 'sbtc-token'),
          stringAsciiCV('sBTC'),
          uintCV(0 * 1000000),
          uintCV(500000000),
          uintCV(900),
          uintCV(14000),
          uintCV(1000),
          uintCV(3000),
          uintCV(6000),
          uintCV(144),
          uintCV(500000000)
        ],
        postConditions: postConditions,
        network,
      },
      async (error?, txId?) => {
        setState(prevState => ({
          ...prevState,
          currentTxId: txId,
          currentTxStatus: 'pending',
        }));
      }
    );
  };


  return (
    <>
      <div className="p-8 md:p-12 bg-white rounded-xl flex items-center shadow-[0px_10px_10px_-5px_#00000003,0px_20px_25px_-5px_#0000000A]">
        <div className="flex flex-col w-full min-h-full">
          <h1 className="text-4xl font-headings">Arkadiko Admin</h1>
          <p className="mt-4">
            Sign multisig transactions (logged in as {stxAddress})
          </p>
          <button
                type="button"
                onClick={() => exec()}
                className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
            Execute
          </button>
        </div>
      </div>
  
    </>
  );
};
