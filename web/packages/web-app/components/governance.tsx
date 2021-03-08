import React from 'react';
import { Box } from '@blockstack/ui';
import { ExplorerLink } from './explorer-link';
import { Container } from './home';

export const Governance = () => {
  return (
    <Container>
      <Box py={6}>
        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Overview</h2>

              <ExplorerLink
                txId="STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6.dao"
                text="View contract in explorer"
                skipConfirmCheck
              />

              <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                Coming in v2
              </h2>
            </div>
          </div>
        </main>
      </Box>
    </Container>
  );
};
