import React, { useEffect, useState, useContext } from 'react';
import { Box, Modal } from '@blockstack/ui';
import { Container } from './home';
import { callReadOnlyFunction, uintCV, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import { typeToReadableName, deductTitle, changeKeyToHumanReadable } from '@common/proposal-utils';
import { TxStatus } from '@components/tx-status';
import { websocketTxUpdater } from '@common/websocket-tx-updater';
import { AppContext } from '@common/context';

export const ViewProposal = ({ match }) => {
  const [_, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [proposal, setProposal] = useState({});
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [amountOfVotes, setAmountOfVotes] = useState('');
  const { doContractCall } = useConnect();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  websocketTxUpdater();

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const proposal = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-dao",
        functionName: "get-proposal-by-id",
        functionArgs: [uintCV(match.params.id)],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(proposal);
      const data = json.value;

      setProposal({
        id: data['id'].value,
        proposer: data['proposer'].value,
        forVotes: data['yes-votes'].value,
        against: data['no-votes'].value,
        token: data['token'].value,
        collateralType: data['collateral-type'].value,
        type: data['type'].value,
        changes: [{
          key: data['changes'].value[0].value['key'].value,
          'old-value': 0,
          'new-value': data['changes'].value[0].value['new-value'].value
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
      contractName: 'arkadiko-dao',
      functionName: 'vote-for',
      functionArgs: [uintCV(match.params.id), uintCV(amountOfVotes * 1000000)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished adding vote for!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowVoteModal(false);
      },
    });
  };

  const addVoteAgainst = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'arkadiko-dao',
      functionName: 'vote-against',
      functionArgs: [uintCV(match.params.id), uintCV(amountOfVotes * 1000000)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished adding vote for!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowVoteModal(false);
      },
    });
  };

  const onInputChange = (event) => {
    const value = event.target.value;
    setAmountOfVotes(value);
  };

  return (
    <Container>
      <Box py={6}>
        <Modal isOpen={showVoteModal}>
          <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                    Vote for Proposal {match.params.id}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Change Risk Parameter "Liquidation Penalty" for STX collateral
                    </p>

                    <div className="mt-4 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      </div>
                      <input type="text" name="stx" id="stxAmount"
                            value={amountOfVotes}
                            onChange={onInputChange}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0.00" aria-describedby="stx-currency" />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm" id="stx-currency">
                          DIKO
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button type="button" onClick={() => addVoteFor()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                  Vote For
                </button>

                <button type="button" onClick={() => addVoteAgainst()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                  Vote Against
                </button>

                <button type="button" onClick={() => setShowVoteModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <Box>
                <h2 className="text-2xl font-bold text-gray-900">
                  Proposal #{match.params.id}
                </h2>

                <div className="bg-white shadow sm:rounded-lg mt-5 w-full">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {proposal.changes ? (
                        `${changeKeyToHumanReadable(proposal.changes[0].key)} ${deductTitle(proposal?.type)} ${proposal?.collateralType.toUpperCase()}`
                      ) : `` }
                    </h3>
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Voting ends at block height {proposal.endBlockHeight}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="px-4 py-5 bg-white rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Votes For
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {proposal.forVotes / 1000000} DIKO
                        </dd>
                      </div>

                      <div className="px-4 py-5 bg-white rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Votes Against
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {proposal.against / 1000000} DIKO
                        </dd>
                      </div>
                    </dl>

                    <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">
                      Details
                    </h3>
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                      Proposer: {proposal.proposer}
                    </div>
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                      Token: {proposal?.token?.toUpperCase()}
                    </div>
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                      Collateral Type: {proposal?.collateralType?.toUpperCase()}
                    </div>
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                      Type: {typeToReadableName(proposal.type)}
                    </div>
                    {proposal.changes ? (
                      <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                        Changes: Change {changeKeyToHumanReadable(proposal.changes[0].key)} to {proposal.changes[0]['new-value']}
                      </div>
                    ): `` }
                  </div>
                </div>

                <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
                  <div className="max-w-xl text-sm text-gray-500">
                    <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
                      <button type="button" onClick={() => setShowVoteModal(true)} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                        Vote
                      </button>
                    </div>
                  </div>
                </div>

              </Box>
            </div>
          </div>
        </main>
      </Box>
    </Container>
  );
};
