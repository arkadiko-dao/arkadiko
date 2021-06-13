import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Box, BoxProps } from '@blockstack/ui';
import { Landing } from './landing';
import { Mint } from './mint';

export const Container: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box className="bg-gray-100 min-h-screen w-full" {...props}>
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {children}
      </div>
    </Box>
  );
};

export const Home: React.FC = () => {
  const [state, _] = useContext(AppContext);

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
