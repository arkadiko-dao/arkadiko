import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Box, BoxProps } from '@blockstack/ui';
import { Landing } from './landing';
import { Mint } from './mint';

export const Container: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box className="bg-gray-100 h-screen" width="100%" px={6} {...props}>
      <Box maxWidth="1200px" mx="auto">
        {children}
      </Box>
    </Box>
  );
};

export const Home: React.FC = () => {
  const state = useContext(AppContext);

  return (
    <Box>
      {state.userData ? (
        <Container>
          <Mint />
        </Container>
      ) : (
        <Landing />
      )}
    </Box>  
  );
};
