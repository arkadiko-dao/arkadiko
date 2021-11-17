import React from 'react';
import { Proposal } from './proposal';

export interface ProposalProps {
  id: string;
  title: string;
  url: string;
  proposer: string;
  forVotes: number;
  against: number;
  startBlockHeight: number;
  endBlockHeight: number;
  changes: object[];
  isOpen: boolean;
  totalVotes: number;
  forVotesPercentage: string;
  againstVotesPercentage: string;
}

export const ProposalGroup: React.FC<ProposalProps[]> = ({ proposals }) => {
  const proposalItems = proposals.map((proposal: ProposalProps) => (
    <Proposal
      key={proposal.id}
      id={proposal.id}
      title={proposal.title}
      url={proposal.url}
      proposer={proposal.proposer}
      forVotes={proposal.forVotes}
      against={proposal.against}
      startBlockHeight={proposal.startBlockHeight}
      endBlockHeight={proposal.endBlockHeight}
      changes={proposal.changes}
      isOpen={proposal.isOpen}
      totalVotes={proposal.totalVotes}
      forVotesPercentage={proposal.forVotesPercentage}
      againstVotesPercentage={proposal.againstVotesPercentage}
    />
  ));

  return (
    <div className="mt-5 overflow-hidden bg-white shadow sm:rounded-md">
      <ul className="divide-y divide-gray-200">{proposalItems}</ul>
    </div>
  );
};
