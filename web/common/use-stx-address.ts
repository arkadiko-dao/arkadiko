import { useContext } from 'react';
import { AppContext } from '@common/context';
import { UserData } from '@stacks/auth';

export const useSTXAddress = (): string | undefined => {
  const [{ userData }, _] = useContext(AppContext);

  return resolveSTXAddress(userData);
};

export const resolveSTXAddress = (userData: UserData | null): string | undefined => {
  let addr;
  if (userData?.addresses && userData.addresses['stx']) addr = userData.addresses['stx'][0]?.address
  if (userData?.addresses && userData.addresses.length > 0) {
    let stxAddress = userData.addresses.filter((address: any) => address['symbol'] === 'STX');
    if (stxAddress[0]) {
      addr = stxAddress[0]?.address;
    } else {
      // using Xverse
      stxAddress = userData.addresses.filter((address: any) => address['addressType'] === 'stacks');
      if (stxAddress[0]) addr = stxAddress[0]?.address;
    }
  }

  return addr;
};

export const bnsName = (): string | undefined => {
  const [{ userData }, _] = useContext(AppContext);
  return userData?.username || useSTXAddress();
};
