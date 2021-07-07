import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ProposalGroup } from '@components/proposal-group';
import { DocumentTextIcon } from '@heroicons/react/outline';

export const Governance = () => {
  const [state, _] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [proposals, setProposals] = useState([]);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const proposals = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-governance-v1-1",
        functionName: "get-proposals",
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(proposals);
      let serializedProposals:Array<{
        id: string,
        proposer: string,
        forVotes: number,
        against: number,
        changes: object[],
        isOpen: boolean,
        startBlockHeight: number,
        endBlockHeight: number
      }> = [];
      const data = json.value.value;

      data.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: element.value['id'].value,
            proposer: element.value['proposer'].value,
            forVotes: element.value['yes-votes'].value,
            against: element.value['no-votes'].value,
            changes: extractChanges(element.value['contract-changes']),
            isOpen: element.value['is-open'].value,
            startBlockHeight: element.value['start-block-height'].value,
            endBlockHeight: element.value['end-block-height'].value
          });
        }
      });
      setProposals(serializedProposals);
    };
    const extractChanges = (changes) => {
      let newChanges = [];
      changes['value'].forEach((change) => {
        newChanges.push(change['value']);
      });
      return newChanges;
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="flex-1 py-12">
            <section>
              <header>
                <div className="bg-indigo-700 rounded-md">
                  <div className="max-w-2xl mx-auto text-center py-5 px-4 sm:py-5 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                      <span className="block">Arkadiko Governance</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-indigo-200">
                      DIKO tokens represent voting shares in Arkadiko governance. <br />
                      You can vote on each proposal and cannot delegate any votes.
                    </p>
                  </div>
                </div>
              </header>

              <div className="mt-8">
                <header className="pb-5 border-b border-gray-200">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Proposals</h2>
                </header>

                {proposals.length > 0 ? (
                  <ProposalGroup proposals={proposals} />
                ) : (
                  <div className="flex justify-center mx-auto mt-12 w-full md:w-2/3">
                    <div className="flow-root bg-gray-100 border-dotted border-2 border-gray-300 rounded-lg p-8">
                      <div className="relative">
                        <div>
                          <div className="md:absolute flex items-center justify-center h-24 w-24 text-gray-600 transform -rotate-12 bg-gray-100 md:-top-12 md:-left-16 mx-auto mb-4 md:mb-0">
                            <DocumentTextIcon className="h-24 w-24 text-gray-600" aria-hidden="true" />
                          </div>
                          <p className="md:ml-16 text-lg leading-6 font-medium text-gray-900">There are currently no proposals to vote on.</p>
                        </div>
                        <p className="mt-2 md:ml-16 text-base text-gray-500">
                          Nothing to see here. Be sure to check out later to not miss any proposals and make your vote count.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
