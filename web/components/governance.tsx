import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ProposalGroup } from '@components/proposal-group';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { EmptyState } from './empty-state';

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
        title: string,
        url: string,
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
            title: element.value['title'].value,
            url: element.value['url'].value,
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
                  <div className="max-w-2xl px-4 py-5 mx-auto text-center sm:py-5 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white font-headings sm:text-4xl">
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
                  <h2 className="text-lg font-medium leading-6 text-gray-900 font-headings">Recent Proposals</h2>
                </header>

                {proposals.length > 0 ? (
                  <ProposalGroup proposals={proposals} />
                ) : (
                  <EmptyState
                    Icon={DocumentTextIcon}
                    title="There are currently no proposals to vote on."
                    description="Nothing to see here. Be sure to check out later to not miss any proposals and make your vote count."
                  />
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
