import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@common/context';
import { getRPCClient } from './utils';
import { useSTXAddress } from './use-stx-address';

export const fetchBalances = async (stxAddress: string) => {
  const client = getRPCClient();

  const account = await client.fetchBalances(stxAddress);
  return {
    arkadiko: account.arkadiko.toString(),
    stx: account.stx.toString()
  };
};
