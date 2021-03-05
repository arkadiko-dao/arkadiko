import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { getRPCClient } from './utils';
import { useSTXAddress } from './use-stx-address';

export const getBalance = () => {
  const stxAddress = useSTXAddress();
  const state = useContext(AppContext);
  const [balance, setBalance] = useState({ stx: '0', arkadiko: '0' });
  const client = getRPCClient();

  useEffect(() => {
    const getBalance = async () => {
      if (stxAddress) {
        try {
          const account = await client.fetchBalances(stxAddress);
          setBalance({
            arkadiko: account.arkadiko.toString(),
            stx: account.stx.toString() 
          });
        } catch (error) {
          console.error('Unable to connect to Stacks Blockchain');
        }
      }
    };
    void getBalance();
  }, [state.userData]);

  return {
    balance,
  };
};
