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
      const proposalsV2 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v2-1',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const jsonV2 = cvToJSON(proposalsV2);
      const dataV2 = jsonV2.value.value;

      const proposalsV3 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v3-1',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const jsonV3 = cvToJSON(proposalsV3);
      const dataV3 = jsonV3.value.value;

      const proposalsV4 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v4-1',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const jsonV4 = cvToJSON(proposalsV4);
      const dataV4 = jsonV4.value.value;

      const proposalsV1 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v1-1',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const jsonV1 = cvToJSON(proposalsV1);
      const dataV1 = jsonV1.value.value;

      const proposalsV42 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v4-2',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const jsonV42 = cvToJSON(proposalsV42);
      const dataV42 = jsonV42.value.value;

      const proposalsV43 = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-governance-v4-3',
        functionName: 'get-proposals',
        functionArgs: [],
        senderAddress: stxAddress || contractAddress,
        network: network,
      });
      const jsonV43 = cvToJSON(proposalsV43);
      const dataV43 = jsonV43.value.value;

      const serializedProposalsV1: {
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

      dataV1.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: Number(element.value['id'].value),
            proposalId: element.value['id'].value,
            governanceVersion: "v1-1",
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


      dataV2.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: Number(element.value['id'].value) + 2,
            proposalId: element.value['id'].value,
            governanceVersion: "v2-1",
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

      dataV3.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: Number(element.value['id'].value) + 2,
            proposalId: element.value['id'].value,
            governanceVersion: "v3-1",
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

      dataV4.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: Number(element.value['id'].value) + 18,
            proposalId: element.value['id'].value,
            governanceVersion: "v4-1",
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

      dataV42.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: Number(element.value['id'].value) + 36,
            proposalId: element.value['id'].value,
            governanceVersion: "v4-2",
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

      dataV43.forEach((element: object) => {
        if (element.value['id'].value != 0) {
          serializedProposals.push({
            id: Number(element.value['id'].value) + 43,
            proposalId: element.value['id'].value,
            governanceVersion: "v4-3",
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

      <Container>
        <main className="flex-1 py-12">
          <section>
            <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
              <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                Governance
              </h3>
              <p className="max-w-4xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
                DIKO tokens represent voting shares in Arkadiko governance.
                You can vote on each proposal and cannot delegate any votes.
              </p>
              <p className="max-w-4xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Your (st)DIKO goes into the voting contract (leaves your wallet) until the end of the vote after which you can withdraw it again.
              </p>
            </header>

            {isLoading ? (
              <div className="mt-5 overflow-hidden bg-white rounded-md shadow dark:bg-zinc-800">
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
              <>
                <ProposalGroup proposals={proposals} />
              </>
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
    </>
  );
};
