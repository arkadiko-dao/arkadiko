import React from 'react';
import { Proposal } from './proposal';

export interface ProposalProps {
  id: string;
  proposer: string;
  forVotes: number;
  against: number;
  token: string;
  type: string;
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
      changes={proposal.changes}
    />
  );

  return (
    <div>
      {proposalItems}
    </div>
  );
};
