import { useContext } from 'react';
import { AppContext } from '@common/context';
import { UserData } from '@stacks/auth';

export const useSTXAddress = (): string | undefined => {
  const { userData } = useContext(AppContext);
  const env = process.env.REACT_APP_NETWORK_ENV;
  const isMainnet = env == 'mainnet';

  if (isMainnet) {
    return userData?.profile?.stxAddress?.mainnet as string;
  }
  return userData?.profile?.stxAddress?.testnet as string;
};

export const resolveSTXAddress = (userData: UserData | null) => {
  const env = process.env.REACT_APP_NETWORK_ENV;
  const isMainnet = env == 'mainnet';

  if (isMainnet) {
    return userData?.profile?.stxAddress?.mainnet as string;
  }
  return userData?.profile?.stxAddress?.testnet as string;
}
