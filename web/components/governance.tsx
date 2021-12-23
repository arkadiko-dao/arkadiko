import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ProposalGroup } from '@components/proposal-group';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { EmptyState } from './ui/empty-state';
import { Placeholder } from './ui/placeholder';

export const Governance = () => {
  const [state, _] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const proposals = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v2-1',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const json = cvToJSON(proposals);
      const data = json.value.value;

      const proposalsV1 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v1-1',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const jsonV1 = cvToJSON(proposalsV1);
      const dataV1 = jsonV1.value.value;

      const serializedProposals: {
        id: string;
        title: string;
        url: string;
        proposer: string;
        forVotes: number;
        against: number;
        changes: object[];
        isOpen: boolean;
        startBlockHeight: number;
        endBlockHeight: number;
      }[] = [];

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
            endBlockHeight: element.value['end-block-height'].value,
          });
        }
      });

      dataV1.forEach((element: object) => {
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
            endBlockHeight: element.value['end-block-height'].value,
          });
        }
      });

      setProposals(serializedProposals);
      setIsLoading(false);
    };
    const extractChanges = changes => {
      const newChanges = [];
      changes['value'].forEach(change => {
        newChanges.push(change['value']);
      });
      return newChanges;
    };
    if (mounted) {
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Governance</title>
      </Helmet>

      {state.userData ? (
        <Container>
          <main className="flex-1 py-12">
            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
                <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                  Governance
                </h3>
                <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
                  DIKO tokens represent voting shares in Arkadiko governance. <br />
                  You can vote on each proposal and cannot delegate any votes.
                </p>
              </header>

              {isLoading ? (
                <div className="mt-5 overflow-hidden bg-white rounded-md shadow dark:bg-zinc-900">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <Placeholder className="py-2" width={Placeholder.width.HALF} />
                      <Placeholder
                        className="justify-end py-2"
                        color={Placeholder.color.GRAY}
                        width={Placeholder.width.THIRD}
                      />
                    </div>

                    <div className="mt-2 sm:flex sm:justify-between">
                      <Placeholder
                        className="py-1"
                        color={Placeholder.color.GRAY}
                        width={Placeholder.width.FULL}
                      />
                      <Placeholder
                        className="justify-end py-1"
                        color={Placeholder.color.GRAY}
                        width={Placeholder.width.HALF}
                      />
                    </div>
                  </div>
                </div>
              ) : proposals.length > 0 ? (
                <ProposalGroup proposals={proposals} />
              ) : (
                <EmptyState
                  Icon={DocumentTextIcon}
                  title="There are currently no proposals to vote on."
                  description="Nothing to see here. Be sure to check out later to not miss any proposals and make your vote count."
                />
              )}
            </section>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
