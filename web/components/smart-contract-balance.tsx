import React, { useEffect, useState } from 'react';
import { getRPCClient } from '@common/utils';
import { Tooltip } from '@blockstack/ui';
import { InformationCircleIcon } from '@heroicons/react/solid';

export const SmartContractBalance = ({ address, description, name }) => {
  const [stxBalance, setStxBalance] = useState(0.0);
  const [dikoBalance, setDikoBalance] = useState(0.0);
  const [usdaBalance, setUsdaBalance] = useState(0.0);
  const [wStxBalance, setWStxBalance] = useState(0.0);
  const [xStxBalance, setXStxBalance] = useState(0.0);

  const [stDikoBalance, setStDikoBalance] = useState(0.0);
  const [wstxDikoBalance, setWstxDikoBalance] = useState(0.0);
  const [wstxUsdaBalance, setWstxUsdaBalance] = useState(0.0);
  const [dikoUsdaBalance, setDikoUsdaBalance] = useState(0.0);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const client = getRPCClient();
      const url = `${client.url}/extended/v1/address/${address}/balances`;
      const response = await fetch(url, { credentials: 'omit' });
      const data = await response.json();
      console.log(data);
      setStxBalance(data.stx.balance / 1000000);
      const dikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-token::diko`];
      if (dikoBalance) {
        setDikoBalance(dikoBalance.balance / 1000000);
      } else {
        setDikoBalance(0.0);
      }

      const usdaBalance = data.fungible_tokens[`${contractAddress}.usda-token::usda`];
      if (usdaBalance) {
        setUsdaBalance(usdaBalance.balance / 1000000);
      } else {
        setUsdaBalance(0.0);
      }

      const wStxBalance = data.fungible_tokens[`${contractAddress}.wrapped-stx-token::wstx`];
      if (wStxBalance) {
        setWStxBalance(wStxBalance.balance / 1000000);
      } else {
        setWStxBalance(0.0);
      }

      const xStxBalance = data.fungible_tokens[`${contractAddress}.xstx-token::xstx`];
      if (xStxBalance) {
        setXStxBalance(xStxBalance.balance / 1000000);
      } else {
        setXStxBalance(0.0);
      }

      const stDikoBalance = data.fungible_tokens[`${contractAddress}.stdiko-token::stdiko`];
      if (stDikoBalance) {
        setStDikoBalance(stDikoBalance.balance / 1000000);
      } else {
        setStDikoBalance(0.0);
      }

      const wstxDikoBalance = data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-diko::wstx-diko`];
      if (wstxDikoBalance) {
        setWstxDikoBalance(wstxDikoBalance.balance / 1000000);
      } else {
        setWstxDikoBalance(0.0);
      }

      const wstxUsdaBalance = data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-usda::wstx-usda`];
      if (wstxUsdaBalance) {
        setWstxUsdaBalance(wstxUsdaBalance.balance / 1000000);
      } else {
        setWstxUsdaBalance(0.0);
      }

      const dikoUsdaBalance = data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-diko-usda::diko-usda`];
      if (dikoUsdaBalance) {
        setDikoUsdaBalance(dikoUsdaBalance.balance / 1000000);
      } else {
        setDikoUsdaBalance(0.0);
      }

    };
    if (mounted) {
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <tr className="bg-white dark:bg-zinc-800">
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        <div className="flex items-center">
          {name}
          <Tooltip shouldWrapChildren={true} label={`${description}`}>
            <InformationCircleIcon className="w-5 h-5 ml-2 text-gray-400" aria-hidden="true" />
          </Tooltip>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {stxBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        STX
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {dikoBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        DIKO
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {usdaBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        USDA
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {wStxBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        wSTX
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {xStxBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        xSTX
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {stDikoBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        stDIKO
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {wstxUsdaBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        wSTX/USDA
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {wstxDikoBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        wSTX/DIKO
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">
        {dikoUsdaBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        DIKO/USDA
      </td>
      <td className="px-6 py-4 text-sm text-left text-gray-500 whitespace-nowrap">{address}</td>
    </tr>
  );
};
