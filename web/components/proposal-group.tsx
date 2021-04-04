import React from 'react';
import { Proposal } from './proposal';

export interface ProposalProps {
  id: string;
  proposer: string;
  forVotes: number;
  against: number;
  token: string;
  type: string;
  startBlockHeight: number;
  endBlockHeight: number;
  changes: object[];
}

export const ProposalGroup: React.FC<ProposalProps[]> = ({ proposals }) => {
  const proposalItems = proposals.map((proposal: ProposalProps) =>
    <Proposal
      key={proposal.id}
      id={proposal.id}
      proposer={proposal.proposer}
      forVotes={proposal.forVotes}
      against={proposal.against}
      token={proposal.token}
      type={proposal.type}
      startBlockHeight={proposal.startBlockHeight}
      endBlockHeight={proposal.endBlockHeight}
      changes={proposal.changes}
    />
  );

  return (
    <div className="bg-white shadow overflow-hidden mt-5 sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {proposalItems}
      </ul>
    </div>
  );
};
