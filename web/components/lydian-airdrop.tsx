import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';
import { InputAmount } from './input-amount';
import {
  AnchorMode,
  uintCV,
  standardPrincipalCV,
  callReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';

export const LydianAirdrop = () => {
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const [state, setState] = useContext(AppContext);

  const [claimAmount, setClaimAmount] = useState(0);

  useEffect(() => {

    const fetchData = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-1',
        functionName: 'ldn-for-user',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(20),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });

      const result = cvToJSON(call).value;
      console.log("result: ", result);

      setClaimAmount(result);
    };

    fetchData();
  }, []);

  const claim = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-1',
      functionName: 'claim',
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
    });
  };

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="flex-1 py-12">
            <section>
              <div className="flex flex-col items-center justify-center flex-1 py-12">
                <div className="relative w-full max-w-lg">
                  <div className="absolute top-0 bg-indigo-400 rounded-full -left-8 w-80 h-80 mix-blend-multiply filter blur-xl opacity-70"></div>
                  <div className="absolute bg-indigo-200 rounded-full -bottom-16 opacity-70 -right-16 w-80 h-80 mix-blend-multiply filter blur-xl"></div>

                  <div className="relative p-4 bg-white rounded-lg">
                    <h2 className="text-2xl font-headings">
                      Lydian Airdrop
                    </h2>
                    <p className="mt-4 text-gray-800">
                      Lydian has been so kind to airdrop LDN tokens to Arkadiko.
                      DIKO holders on block 47500 are able to claim their LDN tokens here.
                    </p><br/>

                    <p className="mt-4 text-gray-800">
                      Check out Lydian at:
                    </p>
                    <a href="https://www.lydian.xyz">- Website</a><br/>
                    <a href="https://discord.gg/7V2hmB8HVq">- Discord</a><br/>
                    <a href="https://twitter.com/Lydian_DAO">- Twitter</a>

                    <div className="mt-6">
   
                      <button
                        type="button"
                        disabled={claimAmount === 0}
                        onClick={() => claim()}
                        className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
