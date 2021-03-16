import React from 'react';
import { ProposalProps } from './proposal-group';

export const Proposal: React.FC<ProposalProps> = ({ id, proposer, type, forVotes, token, against, changes }) => {
  return (
    <div>
      <p>Proposal #{id} on token {token.toUpperCase()}</p>
      <p>Proposer: {proposer}</p>
      <p>Type: {type}</p>
      <p>Votes for: {forVotes}</p>
      <p>Votes against: {against}</p>
      <p>Change {changes[0]['key']} to {changes[0]['new-value']}%</p>
    </div>
  );
};
