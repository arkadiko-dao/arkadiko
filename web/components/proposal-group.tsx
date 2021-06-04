import React from 'react';
import { Proposal } from './proposal';

export interface ProposalProps {
  id: string;
  proposer: string;
  forVotes: number;
  against: number;
  startBlockHeight: number;
  endBlockHeight: number;
  changes: object[];
  isOpen: boolean;
}

export const ProposalGroup: React.FC<ProposalProps[]> = ({ proposals }) => {
  const proposalItems = proposals.map((proposal: ProposalProps) =>
    <Proposal
      key={proposal.id}
      id={proposal.id}
      proposer={proposal.proposer}
      forVotes={proposal.forVotes}
      against={proposal.against}
      startBlockHeight={proposal.startBlockHeight}
      endBlockHeight={proposal.endBlockHeight}
      changes={proposal.changes}
      isOpen={proposal.isOpen}
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
