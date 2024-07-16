import React from 'react';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';
import {
  AnchorMode,
  uintCV,
  standardPrincipalCV,
  callReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';

export const Admin = () => {
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const exec = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: "",
      functionName: "",
      functionArgs: [
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };


  return (
    <>
      <div className="p-8 md:p-12 bg-white rounded-xl flex items-center shadow-[0px_10px_10px_-5px_#00000003,0px_20px_25px_-5px_#0000000A]">
        <div className="flex flex-col w-full min-h-full">
          <h1 className="text-4xl font-headings">Stacking DAO Admin</h1>
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
