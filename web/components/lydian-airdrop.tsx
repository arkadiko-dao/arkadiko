import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';
import { Placeholder } from '../../web/components/ui/placeholder';
import { microToReadable } from '@common/vault-utils';
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
  const [claimAmount1, setClaimAmount1] = useState(0);
  const [claimAmount2, setClaimAmount2] = useState(0);
  const [claimAmount3, setClaimAmount3] = useState(0);
  const [claimAmount4, setClaimAmount4] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    const fetchClaimed = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-1',
        functionName: 'get-claimed',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value;
      return result;
    };

    const fetchLdnForWallet = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-1',
        functionName: 'get-ldn-for-diko-in-wallet',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchLdnForStdiko = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-1',
        functionName: 'get-ldn-for-stdiko-pool',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchLdnForDikoUsda = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-1',
        functionName: 'get-ldn-for-diko-usda-pool',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchLdnForWstxDiko = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-1',
        functionName: 'get-ldn-for-wstx-diko-pool',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchInfo = async () => {
      // Fetch all info
      const [
        // ldnForWallet,
        // ldnForStdiko,
        // ldnForDikoUsda,
        // ldnForWstxDiko,
        claimed
      ] = await Promise.all([
        // fetchLdnForWallet(),
        // fetchLdnForStdiko(),
        // fetchLdnForDikoUsda(),
        // fetchLdnForWstxDiko(),
        fetchClaimed()
      ]);

      // TODO: REMOVE FOR MAINNET
      const ldnForWallet = 3120000;
      const ldnForStdiko = 4230000;
      const ldnForDikoUsda = 0;
      const ldnForWstxDiko = 32000;

      const claimed1 = claimed['amount-wallet'].value;
      const claimed2 = claimed['amount-stdiko'].value;
      const claimed3 = claimed['amount-diko-usda'].value;
      const claimed4 = claimed['amount-wstx-diko'].value;

      setClaimAmount1(ldnForWallet - claimed1);
      setClaimAmount2(ldnForStdiko - claimed2);
      setClaimAmount3(ldnForDikoUsda - claimed3);
      setClaimAmount4(ldnForWstxDiko - claimed4);

      setIsLoading(false);
    };

    fetchInfo();
  }, []);

  const claim1 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-1',
      functionName: 'claim-ldn-for-diko-in-wallet',
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

  const claim2 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-1',
      functionName: 'claim-ldn-for-stdiko-pool',
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

  const claim3 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-1',
      functionName: 'claim-ldn-for-diko-usda-pool',
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

  const claim4 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-1',
      functionName: 'claim-ldn-for-wstx-diko-pool',
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
                      Lydian has been so kind to provide LDN tokens to Arkadiko.
                      DIKO holders on block 47500 are able to claim their LDN tokens here.
                    </p>

                    <p className="mt-4 text-gray-800">
                      Check out Lydian at:
                    </p>
                    <a href="https://www.lydian.xyz">- Website</a><br/>
                    <a href="https://discord.gg/7V2hmB8HVq">- Discord</a><br/>
                    <a href="https://twitter.com/Lydian_DAO">- Twitter</a>

                    <h2 className="text-xl font-headings mt-4">
                      DIKO/USDA pool
                    </h2>
                    <p className="text-gray-800">
                      {isLoading ? (
                        <>
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        </>
                      ) : (
                        <span>
                          Claimable: {' '}
                          {microToReadable(claimAmount1).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })} LDN
                          <button
                            type="button"
                            disabled={claimAmount1 === 0}
                            onClick={() => claim1()}
                            className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                          >
                            Claim
                          </button>
                        </span>
                      )}
                    </p>

                    <h2 className="text-xl font-headings mt-4">
                      wSTX/DIKO pool
                    </h2>
                    <p className="text-gray-800">
                      {isLoading ? (
                        <>
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        </>
                      ) : (
                        <span>
                          Claimable: {' '}
                          {microToReadable(claimAmount2).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })} LDN
                          <button
                            type="button"
                            disabled={claimAmount2 === 0}
                            onClick={() => claim2()}
                            className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                          >
                            Claim
                          </button>
                        </span>
                      )}
                    </p>

                    <h2 className="text-xl font-headings mt-4">
                      stDIKO
                    </h2>
                    <p className="text-gray-800">
                      {isLoading ? (
                        <>
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        </>
                      ) : (
                        <span>
                          Claimable: {' '}
                          {microToReadable(claimAmount3).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })} LDN
                          <button
                            type="button"
                            disabled={claimAmount3 === 0}
                            onClick={() => claim3()}
                            className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                          >
                            Claim
                          </button>
                        </span>
                      )}
                    </p>

                    <h2 className="text-xl font-headings mt-4">
                      DIKO
                    </h2>
                    <p className="text-gray-800">
                      {isLoading ? (
                        <>
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                          <Placeholder className="py-2" width={Placeholder.width.HALF} />
                        </>
                      ) : (
                        <span>
                          Claimable: {' '}
                          {microToReadable(claimAmount4).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })} LDN
                          <button
                            type="button"
                            disabled={claimAmount4 === 0}
                            onClick={() => claim4()}
                            className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                          >
                            Claim
                          </button>
                        </span>
                      )}
                    </p>
         
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
