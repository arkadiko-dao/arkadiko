import React, { useEffect, useState, useContext } from 'react';
import { Modal } from '@blockstack/ui';
import { Container } from './home';
import { AnchorMode, callReadOnlyFunction, contractPrincipalCV, uintCV, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import { AppContext } from '@common/context';
import { ThumbUpIcon, ThumbDownIcon } from '@heroicons/react/outline';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import { getRPCClient } from '@common/utils';
import { ProposalProps } from './proposal-group';

export const ViewProposal = ({ match }) => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [proposal, setProposal] = useState<ProposalProps>({});
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [amountOfVotes, setAmountOfVotes] = useState('');
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const [stacksTipHeight, setStacksTipHeight] = useState(0);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
  }, [state.currentTxStatus]);

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      let data = await response.json();
      setStacksTipHeight(data['stacks_tip_height']);

      const proposal = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-governance-v1-1",
        functionName: "get-proposal-by-id",
        functionArgs: [uintCV(match.params.id)],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(proposal);
      data = json.value;

      setProposal({
        id: data['id'].value,
        title: data['title'].value,
        url: data['url'].value,
        proposer: data['proposer'].value,
        forVotes: data['yes-votes'].value,
        against: data['no-votes'].value,
        changes: [{
          'name': data['contract-changes'].value[0].value['name'].value,
          'address': data['contract-changes'].value[0].value['address'].value,
          'qualified-name': data['contract-changes'].value[0].value['qualified-name'].value
        }],
        isOpen: data['is-open'].value,
        startBlockHeight: data['start-block-height'].value,
        endBlockHeight: data['end-block-height'].value
      });
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  const addVoteFor = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-governance-v1-1',
      functionName: 'vote-for',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-stake-pool-diko-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-token'),
        uintCV(match.params.id), uintCV(amountOfVotes * 1000000)
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowVoteModal(false);
      },
      anchorMode: AnchorMode.Any
    });
  };

  const addVoteAgainst = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-governance-v1-1',
      functionName: 'vote-against',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-stake-pool-diko-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-token'),
        uintCV(match.params.id), uintCV(amountOfVotes * 1000000)
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowVoteModal(false);
      },
      anchorMode: AnchorMode.Any
    });
  };

  const onInputChange = (event) => {
    const value = event.target.value;
    setAmountOfVotes(value);
  };

  return (
    <Container>
      <Modal isOpen={showVoteModal}>
        <div className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block px-2 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
                  Vote for Proposal {match.params.id}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {proposal.title}
                  </p>

                  <div className="relative mt-4 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    </div>
                    <input type="text" name="stx" id="stxAmount"
                          value={amountOfVotes}
                          onChange={onInputChange}
                          className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pl-7 sm:text-sm"
                          placeholder="0.00" aria-describedby="stx-currency" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stx-currency">
                        DIKO
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => addVoteFor()} className="inline-flex justify-center w-full px-4 py-2 mb-5 text-base font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Vote For
              </button>

              <button type="button" onClick={() => addVoteAgainst()} className="inline-flex justify-center w-full px-4 py-2 mb-5 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Vote Against
              </button>

              <button type="button" onClick={() => setShowVoteModal(false)} className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <main className="my-16">
        <section>
          <header className="pb-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold leading-6 text-gray-900 font-headings">
              Proposal #{match.params.id} - {proposal.title}
            </h2>
          </header>
        
          <div className="mt-4">
            <div className="sm:grid sm:grid-cols-2 sm:gap-x-4">
              <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings">
                    Details
                  </h3>
                </div>
                <div className="px-4 py-5 border-t border-gray-200 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="inline-flex items-center text-sm font-medium text-gray-500">
                        Link
                        <ExternalLinkIcon className="block w-3 h-3 ml-2" aria-hidden="true" />
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <p className="truncate">
                          <a href={`${proposal.url}`} target="_blank" className="text-sm font-medium text-indigo-700 rounded-sm hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {proposal.url}
                          </a>
                        </p>
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="inline-flex items-center text-sm font-medium text-gray-500">
                        Proposer
                        <ExternalLinkIcon className="block w-3 h-3 ml-2" aria-hidden="true" />
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <a href={`https://explorer.stacks.co/address/${proposal.proposer}`} target="_blank" className="text-sm font-medium text-indigo-700 rounded-sm hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          {proposal.proposer}
                        </a>
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Start date
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        Block {proposal.startBlockHeight}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        End date
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        Block {proposal.endBlockHeight} (~{((Number(proposal.endBlockHeight) - stacksTipHeight) * 10 / 60 / 24).toFixed(2)} days)
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <dl className="bg-white rounded-lg shadow sm:grid sm:grid-cols-2">
                <div className="flex flex-col justify-center p-6 text-center border-b border-gray-200 sm:border-0 sm:border-r">
                  <dt className="inline-flex items-center order-2 mx-auto mt-2 text-lg font-medium leading-6 text-gray-500">
                    <ThumbUpIcon className="block w-6 h-6 mr-2 text-gray-400" aria-hidden="true" />
                    Vote For
                  </dt>
                  <dd className="order-1 text-3xl font-bold text-indigo-600">{proposal.forVotes / 1000000} DIKO</dd>
                </div>
                <div className="flex flex-col justify-center p-6 text-center border-t border-gray-100 sm:border-0 sm:border-l">
                  <dt className="inline-flex items-center order-2 mx-auto mt-2 text-lg font-medium leading-6 text-gray-500">
                    <ThumbDownIcon className="block w-6 h-6 mr-2 text-gray-400" aria-hidden="true" />
                    Vote Against
                  </dt>
                  <dd className="order-1 text-3xl font-bold text-indigo-600">{proposal.against / 1000000} DIKO</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6">
              <div className="flex justify-center">
                <button type="button" onClick={() => setShowVoteModal(true)} className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Vote
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Container>
  );
};
