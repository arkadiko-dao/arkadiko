import React, { useEffect, useState } from 'react';
import { Box } from '@blockstack/ui';
import { Container } from './home';
import { callReadOnlyFunction, uintCV, cvToJSON } from '@stacks/transactions';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';

export const ViewProposal = ({ match }) => {
  const stxAddress = useSTXAddress();
  const [proposal, setProposal] = useState({});

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const proposal = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "dao",
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
        type: data['type'].value,
        changes: [{
          key: data['changes'].value[0].value['key'].value,
          'old-value': 0,
          'new-value': data['changes'].value[0].value['new-value'].value
        }],
        startBlockHeight: data['start-block-height'].value,
        endBlockHeight: data['end-block-height'].value
      });
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  const changeKeyToHumanReadable = (keyName: string) => {
    if (keyName === 'liquidation_penalty') {
      return 'Liquidation Penalty';
    }

    return 'unknown';
  };

  const callVote = () => {
    console.log('VOTING!!!');
  };

  return (
    <Container>
      <Box py={6}>
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
                      Change Risk Parameter "Liquidation Penalty" for STX collateral
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
                          {proposal.forVotes}
                        </dd>
                      </div>

                      <div className="px-4 py-5 bg-white rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Votes Against
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {proposal.against}
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
                      Token: {proposal.token}
                    </div>
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                      Type: {proposal.type}
                    </div>
                    {proposal.changes ? (
                      <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                        Changes: Change {changeKeyToHumanReadable(proposal.changes[0].key)} to {proposal.changes[0]['new-value']}%
                      </div>
                    ): `` }
                  </div>
                </div>

                <div className="mt-5 ml-5 sm:flex sm:items-start sm:justify-between">
                  <div className="max-w-xl text-sm text-gray-500">
                    <div className="mt-5 sm:mt-0 sm:flex-shrink-0 sm:flex sm:items-right">
                      <button type="button" onClick={() => callVote()} className="inline-flex items-right px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
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
