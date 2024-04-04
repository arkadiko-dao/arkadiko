import React from 'react';
import { Proposal } from './proposal';

export interface ProposalProps {
  id: number;
  proposalId: string,
  governanceVersion: string,
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
  forVotesPercentage: number;
  againstVotesPercentage: number;
}

export const ProposalGroup: React.FC<ProposalProps[]> = ({ proposals }) => {
  const proposalItems = proposals.map((proposal: ProposalProps) => (
    <Proposal
      key={proposal.id}
      proposalId={proposal.proposalId}
      governanceVersion={proposal.governanceVersion}
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

  proposalItems.sort((a, b) => (a.endBlockHeight > b.endBlockHeight ? 1 : -1));

  return (
    <div className="mt-5 overflow-hidden bg-white rounded-md shadow dark:bg-zinc-800">
      <ul className="divide-y divide-gray-200 dark:divide-zinc-600">{proposalItems}</ul>
    </div>
  );
};
