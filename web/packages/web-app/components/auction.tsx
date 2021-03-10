import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Box } from '@blockstack/ui';
import { Redirect } from 'react-router-dom';
import { Container } from './home'

export const Auction: React.FC = () => {
  const state = useContext(AppContext);

  return (
    <Box>
      {state.userData ? (
        <Container>
          <Box py={6}>
            <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8">Auctions</h2>
                  <p>There are currently no open auctions</p>
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
