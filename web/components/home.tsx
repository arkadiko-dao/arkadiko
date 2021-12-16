import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Mint } from './mint';
import { Redirect } from 'react-router-dom';

export interface ContainerProps {}

export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-zinc-700" {...props}>
      <div className="px-6 mx-auto max-w-7xl lg:px-8">{children}</div>
    </div>
  );
};

export const Home: React.FC = () => {
  const [state, _] = useContext(AppContext);

  return (
    <>
      {state.userData ? (
        <Container>
          <Mint />
        </Container>
      ) : (
        <div className="w-full min-h-screen overflow-hidden bg-gray-100">
          <div className="px-6 mx-auto lg:px-8 sm:pb-12">
            <main className="pt-12 pb-12 sm:pt-0">
              <div className="relative max-w-[554px] mx-auto">
                <img
                  className={'filter blur transition duration-200 ease-in-out'}
                  src="/assets/onboarding/swap.png"
                  alt=""
                />
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
};
