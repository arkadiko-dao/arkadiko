import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Mint } from './mint';

export interface ContainerProps {}

export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-zinc-900" {...props}>
      <div className="px-6 mx-auto max-w-7xl lg:px-8">{children}</div>
    </div>
  );
};

export const Home: React.FC = () => {
  const [state, _] = useContext(AppContext);

  return (
    <Container>
        <Mint />
    </Container>
  );
};
