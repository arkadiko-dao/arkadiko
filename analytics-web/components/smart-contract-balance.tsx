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
      console.log(client.url);
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
    <div
      key={name}
      className="relative flex px-6 py-5 pb-0 space-x-3 bg-white border border-gray-300 rounded-lg shadow-sm"
    >
      <div className="flex flex-col flex-1 min-w-0 group">
        <h3 className="text-lg font-semibold leading-none text-gray-900">{name}</h3>
        <p className="max-w-4xl mt-1 text-xs text-gray-500">
          {description}
        </p>
        <div className="flex flex-col h-full mt-2 mb-4">
          {stxBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {stxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">STX</span>
            </p>
          ) : null}
          {dikoBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {dikoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">DIKO</span>
            </p>
          ) : null}
          {usdaBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {usdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">USDA</span>
            </p>
          ) : null}
          {wStxBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {wStxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX</span>
            </p>
          ) : null}
          {xStxBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {xStxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">xSTX</span>
            </p>
          ) : null}
          {stDikoBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {stDikoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">stDIKO</span>
            </p>
          ) : null}
          {wstxUsdaBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {wstxUsdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX/USDA</span>
            </p>
          ) : null}
          {wstxDikoBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {wstxDikoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX/DIKO</span>
            </p>
          ) : null}
          {dikoUsdaBalance ? (
            <p className="text-lg font-semibold text-gray-600">
              {dikoUsdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">DIKO/USDA</span>
            </p>
          ) : null}
        </div>
        <div className="px-6 py-3 mt-auto -mx-6 rounded-bl-lg rounded-br-lg bg-gray-50 group-hover:bg-gray-100">
          <p className="text-xs font-semibold leading-none text-gray-400 uppercase">Contract name</p>
          <p className="truncate">
            <a 
              target="_blank"
              rel="noopener noreferrer"
              href={`https://explorer.stacks.co/address/${address}`}
              className="text-xs text-gray-600 hover:text-indigo-700">
                {address}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};