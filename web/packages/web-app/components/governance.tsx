import React, { useEffect, useContext, useState } from 'react';
import { Box, Text } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { callReadOnlyFunction, uintCV, stringAsciiCV, listCV, tupleCV, cvToJSON } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ProposalGroup } from '@components/proposal-group';
import { Link } from '@components/link';

export const Governance = () => {
  const state = useContext(AppContext);
  const { doContractCall } = useConnect();
  const stxAddress = useSTXAddress();
  const [proposals, setProposals] = useState([]);
  const env = process.env.REACT_APP_NETWORK_ENV;

  const callAddProposal = async () => {
    const authOrigin = getAuthOrigin();
    const content = "<h2>Proposal</h2><p>Add new stability parameter details</p>";

    const list = listCV([
      tupleCV({
        key: stringAsciiCV("liquidation_penalty"),
        'new-value': uintCV(15)
      })
    ])
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'dao',
      functionName: 'propose',
      functionArgs: [uintCV(200), stringAsciiCV(content), stringAsciiCV("change_risk_parameter"), list],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished add new proposal', data);
      },
    });
  };

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const proposal = await callReadOnlyFunction({
        contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
        contractName: "dao",
        functionName: "get-proposal-by-id",
        functionArgs: [uintCV(1)],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(proposal);
      let serializedProposals:Array<{
        id: string,
        proposer: string,
        forVotes: number,
        against: number,
        token: string,
        type: string,
        changes: object[],
        'start-block-height': number,
        'end-block-height': number
      }> = [];
      const data = json.value;

      if (data['id'].value != 0) {
        serializedProposals.push({
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
      }
      setProposals(serializedProposals);
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  return (
    <Box>
      {state.userData ? (
        <Container>
          <Box py={6}>
            <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                  <div className="bg-indigo-700">
                    <div className="max-w-2xl mx-auto text-center py-5 px-4 sm:py-5 sm:px-6 lg:px-8">
                      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        <span className="block">Arkadiko Governance</span>
                      </h2>
                      <p className="mt-4 text-lg leading-6 text-indigo-200">
                        DIKO tokens represent voting shares in Arkadiko governance. You can vote on each proposal and cannot delegate any votes.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">
                    Current Open Proposals

                    {env == 'mocknet' ? (
                      <Box>
                        <Link onClick={() => callAddProposal()} color="blue" display="inline-block" my={3} ml={5}>
                          (Get 5000 DIKO tokens from mocknet)
                        </Link>
                      </Box>
                    ) : ``}
                  </h2>
                  {proposals.length > 0 ? (
                    <ProposalGroup proposals={proposals} />
                  ) : (
                    <p>There are currently no proposals to vote on.</p>
                    )}
                  <p className="mt-8">
                    <Text onClick={() => callAddProposal()}
                          _hover={{ cursor: 'pointer'}}
                          className="inline-flex items-center mt-8 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-5">
                      Add test proposal
                    </Text>
                  </p>
                </div>
              </div>
            </main>
          </Box>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </Box>
  );
};
