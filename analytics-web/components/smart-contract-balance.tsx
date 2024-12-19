import React, { useEffect, useState } from 'react';
import { getRPCClient } from '@common/utils';

export const SmartContractBalance = ({ address, description, name }) => {
  const [stxBalance, setStxBalance] = useState(0.0);
  const [wstxBalance1, setWstxBalance1] = useState(0.0);
  const [dikoBalance, setDikoBalance] = useState(0.0);
  const [usdaBalance, setUsdaBalance] = useState(0.0);
  const [wStxBalance, setWStxBalance] = useState(0.0);
  const [xStxBalance, setXStxBalance] = useState(0.0);
  const [xBtcBalance, setXbtcBalance] = useState(0.0);
  const [atAlexBalance, setAtAlexBalance] = useState(0.0);
  const [stStxBalance, setStStxBalance] = useState(0.0);
  const [sBtcBalance, setSbtcBalance] = useState(0.0);

  const [stDikoBalance, setStDikoBalance] = useState(0.0);
  const [wstxDikoBalance, setWstxDikoBalance] = useState(0.0);
  const [wstxUsdaBalance, setWstxUsdaBalance] = useState(0.0);
  const [dikoUsdaBalance, setDikoUsdaBalance] = useState(0.0);
  const [wstxXbtcBalance, setWstxXbtcBalance] = useState(0.0);
  const [xbtcUsdaBalance, setXbtcUsdaBalance] = useState(0.0);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const getData = async () => {
      const client = getRPCClient();
      const url = `${client.url}/extended/v1/address/${address}/balances`;
      const response = await fetch(url, { credentials: 'omit' });
      const data = await response.json();
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

      const wstxBalance1 = data.fungible_tokens[`${contractAddress}.wstx-token::wstx`];
      if (wstxBalance1) {
        setWstxBalance1(wstxBalance1.balance / 1000000);
      } else {
        setWstxBalance1(0.0);
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

      const stStxBalance = data.fungible_tokens[`SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token::ststx`];
      if (stStxBalance) {
        setStStxBalance(stStxBalance.balance / 1000000);
      } else {
        setStStxBalance(0.0);
      }

      const atAlexBalance = data.fungible_tokens[`SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.auto-alex::auto-alex`];
      if (atAlexBalance) {
        setAtAlexBalance(atAlexBalance.balance / 100000000);
      } else {
        setAtAlexBalance(0.0);
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

      const wstxXbtcBalance = data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-wstx-xbtc::wstx-xbtc`];
      if (wstxXbtcBalance) {
        setWstxXbtcBalance(wstxXbtcBalance.balance / 1000000);
      } else {
        setWstxXbtcBalance(0.0);
      }

      const xbtcBalance = data.fungible_tokens[`SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin::wrapped-bitcoin`];
      if (xbtcBalance) {
        setXbtcBalance(xbtcBalance.balance / 100000000);
      } else {
        setXbtcBalance(0.0);
      }

      const sbtcBalance = data.fungible_tokens[`SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token`];
      if (sbtcBalance) {
        setSbtcBalance(sBtcBalance.balance / 100000000);
      } else {
        setSbtcBalance(0.0);
      }

      const xbtcUsdaBalance = data.fungible_tokens[`${contractAddress}.arkadiko-swap-token-xbtc-usda::xbtc-usda`];
      if (xbtcUsdaBalance) {
        setXbtcUsdaBalance(xbtcUsdaBalance.balance / 1000000);
      } else {
        setXbtcUsdaBalance(0.0);
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
      className="relative flex px-6 py-5 space-x-3 bg-white border border-gray-300 rounded-lg shadow-sm"
    >
      <div className="flex flex-col flex-1 min-w-0 group">
        <h3 className="text-lg font-semibold leading-none text-gray-900">{name}</h3>
        <p className="max-w-4xl mt-1 text-xs text-gray-500">
          {description}
        </p>
        <div className="flex flex-col h-full my-4">
          {wstxBalance1 ? (
            <p className="text-lg font-semibold text-gray-800">
              {wstxBalance1.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">STX</span>
            </p>
          ) : null}
          {stxBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {stxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">STX</span>
            </p>
          ) : null}
          {stStxBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {stStxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">stSTX</span>
            </p>
          ) : null}
          {sBtcBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {sBtcBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">sBTC</span>
            </p>
          ) : null}
          {dikoBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {dikoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">DIKO</span>
            </p>
          ) : null}
          {usdaBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {usdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">USDA</span>
            </p>
          ) : null}
          {xBtcBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {xBtcBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
              })}{' '}
              <span className="text-sm font-normal">xBTC</span>
            </p>
          ) : null}
          {atAlexBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {atAlexBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
              })}{' '}
              <span className="text-sm font-normal">atALEX</span>
            </p>
          ) : null}
          {wStxBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {wStxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX</span>
            </p>
          ) : null}
          {xStxBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {xStxBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">xSTX</span>
            </p>
          ) : null}
          {stDikoBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {stDikoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">stDIKO</span>
            </p>
          ) : null}
          {wstxUsdaBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {wstxUsdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX/USDA</span>
            </p>
          ) : null}
          {wstxDikoBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {wstxDikoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX/DIKO</span>
            </p>
          ) : null}
          {dikoUsdaBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {dikoUsdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">DIKO/USDA</span>
            </p>
          ) : null}
          {wstxXbtcBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {wstxXbtcBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">wSTX/xBTC</span>
            </p>
          ) : null}
          {xbtcUsdaBalance ? (
            <p className="text-lg font-semibold text-gray-800">
              {xbtcUsdaBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}{' '}
              <span className="text-sm font-normal">xBTC/USDA</span>
            </p>
          ) : null}
        </div>
        <div className="p-3 mt-auto rounded-md bg-gray-50">
          <p className="text-xs font-semibold leading-none text-gray-500 uppercase">Contract</p>
          <p className="truncate">
            <a 
              target="_blank"
              rel="noopener noreferrer"
              href={`https://explorer.hiro.so/address/${address}`}
              className="text-xs text-indigo-700">
                {address}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
