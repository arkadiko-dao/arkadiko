import React, { useContext } from 'react';
import { AppContext } from '@common/context';
import { Box, Text, Flex, space, BoxProps } from '@blockstack/ui';
import { Auth } from './auth';
import { Landing } from './landing';
import { Mint } from './mint';
import { getBalance } from '@common/get-balance';
import { getStxPrice } from '@common/get-stx-price';

const Container: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box width="100%" px={6} {...props}>
      <Box maxWidth="900px" mx="auto">
        {children}
      </Box>
    </Box>
  );
};

export const Home: React.FC = () => {
  const state = useContext(AppContext);

  const Page: React.FC = () => {
    const balance = getBalance();
    const price = parseFloat(getStxPrice().price);

    return (
      <>
        <Container>
          {state.userData ? (
            <Box>
              <div className="flex justify-center">
                <div className="max-w-7xl w-full mx-auto py-2 sm:px-6 lg:px-2">
                  <div className="flex flex-col lg:flex-row w-full lg:space-x-2 space-y-2 lg:space-y-0 mb-2 lg:mb-4">

                    <div className="w-full lg:w-1/4">
                      <div className="widget w-full p-4 rounded-lg bg-white border-l-4 border-purple-400">
                        <div className="flex items-center">
                          <div className="icon w-14 p-3.5 bg-purple-400 text-white rounded-full mr-3">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="text-lg">{parseInt(balance.balance['stx'], 10) / 1000000} STX</div>
                            <div className="text-sm text-gray-400">balance</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-1/4">
                      <div className="widget w-full p-4 rounded-lg bg-white border-l-4 border-blue-400">
                        <div className="flex items-center">
                          <div className="icon w-14 p-3.5 bg-blue-400 text-white rounded-full mr-3">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="text-lg">{parseInt(balance.balance['arkadiko'], 10) / 1000000} DIKO</div>
                            <div className="text-sm text-gray-400">balance</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-1/4">
                        <div className="widget w-full p-4 rounded-lg bg-white border-l-4 border-green-400">
                            <div className="flex items-center">
                                <div className="icon w-14 p-3.5 bg-green-400 text-white rounded-full mr-3">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="text-lg">${price / 100}</div>
                                    <div className="text-sm text-gray-400">last STX price</div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </Box>
          ) : null }
        </Container>
        <Container>
          <Mint />
        </Container>
      </>
    );
  };
  return (
    <Box>
      {state.userData ? (
        <Flex flexWrap="wrap">
          <Container mt={15}>
            <Page />
          </Container>
        </Flex>
      ) : (
        <Landing />
      )}
    </Box>  
  );
};
