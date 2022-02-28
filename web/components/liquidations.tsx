import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network } from '@common/utils';
import {
  AnchorMode,
  callReadOnlyFunction,
  cvToJSON,
  tupleCV,
  uintCV,
  standardPrincipalCV,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { AuctionProps, AuctionGroup } from '@components/auction-group';
import { microToReadable } from '@common/vault-utils';
import { LotGroup } from '@components/lot-group';
import { InputAmount } from './input-amount';
import { getRPCClient } from '@common/utils';
import { DocumentSearchIcon, GiftIcon, CashIcon } from '@heroicons/react/outline';
import { EmptyState } from './ui/empty-state';
import { Placeholder } from "./ui/placeholder";

export const Liquidations: React.FC = () => {
  const { doContractCall } = useConnect();
  const [state, _] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const [auctions, setAuctions] = useState([]);
  const [lots, setLots] = useState([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [redeemableStx, setRedeemableStx] = useState(0);
  const [stacksTipHeight, setStacksTipHeight] = useState(0);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  useEffect(() => {
    let mounted = true;

    const auctionOpen = async auctionId => {
      const auctionOpenCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-auction-engine-v2-1',
        functionName: 'get-auction-open',
        functionArgs: [uintCV(auctionId)],
        senderAddress: stxAddress || '',
        network: network,
      });
      const isOpen = cvToJSON(auctionOpenCall);
      return isOpen.value.value;
    };

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const getData = async () => {
      const client = getRPCClient();
      const response = await fetch(`${client.url}/v2/info`, { credentials: 'omit' });
      const data = await response.json();
      setStacksTipHeight(data['stacks_tip_height']);

      const auctionIdsCall = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-auction-engine-v2-1',
        functionName: 'get-auction-ids',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const auctionIds = auctionIdsCall.value.list;
      const serializedAuctions: AuctionProps[] = [];
      await asyncForEach(auctionIds, async (auctionId: number) => {
        const auction = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-auction-engine-v2-1',
          functionName: 'get-auction-by-id',
          functionArgs: [uintCV(auctionId.value)],
          senderAddress: stxAddress || '',
          network: network,
        });
        const json = cvToJSON(auction);

        const data = json.value;
        const isOpen = await auctionOpen(data['id'].value);
        if (isOpen) {
          serializedAuctions.push({
            id: data['id'].value,
            lotId: data['lots-sold'].value,
            auctionType: data['auction-type'].value,
            collateralToken: data['collateral-token'].value,
            debt: '0',
            endsAt: data['ends-at'].value,
          });
        }
      });

      const getLastBid = async (auctionId: number, lotId: number) => {
        const lastBid = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-auction-engine-v2-1',
          functionName: 'get-last-bid',
          functionArgs: [uintCV(auctionId), uintCV(lotId)],
          senderAddress: stxAddress || '',
          network: network,
        });
        const bid = cvToJSON(lastBid).value;
        return bid;
      };

      const lots = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-auction-engine-v2-1',
        functionName: 'get-winning-lots',
        functionArgs: [standardPrincipalCV(stxAddress || '')],
        senderAddress: stxAddress || '',
        network: network,
      });
      const jsonLots = cvToJSON(lots);
      let isAuctionOpen;

      const serializedLots: {
        'lot-id': string;
        'auction-id': string;
        'collateral-amount': number;
        'collateral-token': string;
        usda: number;
      }[] = [];
      await asyncForEach(jsonLots.value.ids.value, async (e: object) => {
        const lot = tupleCV(e);
        const data = lot.data.value;
        if (Number(data['auction-id'].value) !== 0) {
          isAuctionOpen = await auctionOpen(data['auction-id'].value);
          const lastBid = await getLastBid(data['auction-id'].value, data['lot-index'].value);

          if (!isAuctionOpen && !lastBid['redeemed'].value) {
            serializedLots.push({
              'lot-id': data['lot-index'].value,
              'auction-id': data['auction-id'].value,
              'collateral-amount': lastBid['collateral-amount'].value,
              'collateral-token': lastBid['collateral-token'].value,
              usda: lastBid['usda'].value,
            });
          }
        }
      });
      setLots(serializedLots);

      setAuctions(serializedAuctions);
      setLoadingAuctions(false);

      const stxRedeemable = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-stx-redeemable',
        functionArgs: [],
        senderAddress: stxAddress || '',
        network: network,
      });
      const jsonStxRedeemable = cvToJSON(stxRedeemable);
      setRedeemableStx(jsonStxRedeemable.value.value);
    };
    if (mounted) {
      void getData();
    }

    return () => {
      mounted = false;
    };
  }, []);

  const redeemStx = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'redeem-stx',
      functionArgs: [uintCV(state.balance['xstx'])],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished redeeming stx!', data);
        // setTxId(data.txId);
      },
      anchorMode: AnchorMode.Any,
    });
  };

  return (
    <>
      <Helmet>
        <title>Liquidations</title>
      </Helmet>

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">
            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">Your rewards</h3>
                </div>
              </header>
              <div className="mt-4">
                {state.balance['xstx'] > 0 ? (
                  <p className="mt-2">
                    <button
                      type="button"
                      onClick={() => redeemStx()}
                      className="mt-2 px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Redeem
                    </button>
                  </p>
                ) : (
                  <EmptyState
                  Icon={CashIcon}
                  title="You have no rewards to claim."
                  description="DIKO and liquidation rewards will appear here."
                />
                )}
              </div>
            </section>

            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">DIKO emmissions</h3>
                </div>
              </header>
              <div className="mt-4">
                <p className="mb-4 text-gray-900 dark:text-zinc-100">Current block: {stacksTipHeight}</p>
                <p className="mb-4 text-gray-900 dark:text-zinc-100">Next DIKO rewards at block: {stacksTipHeight}</p>

                <button
                  type="button"
                  className="inline-flex justify-center w-1/4 px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  // disabled={buttonDisabled}
                  // onClick={buttonAction}
                  // ref={actionButtonRef}
                >
                  Add DIKO rewards to pool
                </button>
              </div>
            </section>

            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">USDA pool</h3>
                </div>
              </header>
              <div className="mt-4">
                
              <InputAmount
                balance={microToReadable(state.balance['usda']).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
                token='USDA'
                // inputName={`stakeLp-${tokenName}`}
                // inputId={`stakeAmount-${tokenName}`}
                // inputValue={stakeAmount}
                // inputLabel={`Stake ${tokenName}`}
                // onInputChange={onInputStakeChange}
                // onClickMax={stakeMaxAmount}
                // ref={inputRef}
              />
              <button
                type="button"
                className="inline-flex justify-center w-1/4 px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                // disabled={buttonDisabled}
                // onClick={buttonAction}
                // ref={actionButtonRef}
              >
                Add USDA to pool
              </button>

              <InputAmount
                balance={microToReadable(state.balance['usda']).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
                token='USDA'
                // inputName={`stakeLp-${tokenName}`}
                // inputId={`stakeAmount-${tokenName}`}
                // inputValue={stakeAmount}
                // inputLabel={`Stake ${tokenName}`}
                // onInputChange={onInputStakeChange}
                // onClickMax={stakeMaxAmount}
                // ref={inputRef}
              />
              <button
                type="button"
                className="inline-flex justify-center w-1/4 px-4 py-2 mb-4 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                // disabled={buttonDisabled}
                // onClick={buttonAction}
                // ref={actionButtonRef}
              >
                Remove USDA from pool
              </button>

              </div>
            </section>

          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
