import React, { useEffect, useContext, useState } from 'react';
import { Box } from '@blockstack/ui';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { callReadOnlyFunction, uintCV, cvToJSON } from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { ProposalGroup } from '@components/proposal-group';

export const Governance = () => {
  const state = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [proposals, setProposals] = useState([]);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const proposals = await callReadOnlyFunction({
        contractAddress,
        contractName: "dao",
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
        token: string,
        type: string,
        collateralType: string,
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
            token: element.value['token'].value,
            collateralType: element.value['collateral-type'].value,
            type: element.value['type'].value,
            changes: extractChanges(element.value['changes']),
            isOpen: element.value['is-open'].value,
            startBlockHeight: element.value['start-block-height'].value,
            endBlockHeight: element.value['end-block-height'].value
          });
        }
      });
      setProposals(serializedProposals);
    };
    const extractChanges = (changes) => {
      console.log(changes);
      return [];
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
                    Recent Proposals
                  </h2>
                  {proposals.length > 0 ? (
                    <ProposalGroup proposals={proposals} />
                  ) : (
                    <p>There are currently no proposals to vote on.</p>
                  )}
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
