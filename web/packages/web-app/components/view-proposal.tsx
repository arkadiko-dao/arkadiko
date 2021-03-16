import React from 'react';

export const ViewProposal = ({ match }) => {
  return (
    <p>Great proposal {match.params.id}</p>
  );
};
