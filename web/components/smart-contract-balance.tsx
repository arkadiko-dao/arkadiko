import React, { useEffect, useState } from 'react';
import { getRPCClient } from '@common/utils';

export const SmartContractBalance = ({ address }) => {
  const [stxBalance, setStxBalance] = useState(0.0);
  const [dikoBalance, setDikoBalance] = useState(0.0);
  const [xusdBalance, setXusdBalance] = useState(0.0);
  const [wStxBalance, setWStxBalance] = useState(0.0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      console.log('wow');
      const client = getRPCClient();
      const url = `${client.url}/extended/v1/address/${address}/balances`;
      const response = await fetch(url, { credentials: 'omit' });
      const data = await response.json();
      console.log(data);
      setStxBalance(data.stx.balance / 1000000);
      const dikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-token::diko`];
      if (dikoBalance) {
        setDikoBalance(dikoBalance.balance);
      } else {
        setDikoBalance(0.0);
      }

      const xusdBalance = data.fungible_tokens[`${contractAddress}.xusd-token::xusd`];
      if (xusdBalance) {
        setXusdBalance(xusdBalance.balance);
      } else {
        setXusdBalance(0.0);
      }

      const wStxBalance = data.fungible_tokens[`${contractAddress}.wrapped-stx-token::wstx`];
      if (wStxBalance) {
        setWStxBalance(wStxBalance.balance);
      } else {
        setWStxBalance(0.0);
      }
    };
    if (mounted) {
      void getData();
    }

    return () => { mounted = false; }
  }, []);

  return (
    <tr className="bg-white">
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        {address}
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        {stxBalance} STX
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        {dikoBalance} DIKO
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        {xusdBalance} xUSD
      </td>
      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
        {wStxBalance} wSTX
      </td>
    </tr>
  )
};
