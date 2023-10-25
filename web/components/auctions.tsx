import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { useConnect } from '@stacks/connect-react';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
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
import { LotGroup } from '@components/lot-group';
import { getRPCClient } from '@common/utils';
import { DocumentSearchIcon, GiftIcon, CashIcon } from '@heroicons/react/outline';
import { EmptyState } from './ui/empty-state';
import { Placeholder } from './ui/placeholder';

export const Auctions: React.FC = () => {
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
        contractName: 'arkadiko-auction-engine-v3-1',
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
        contractName: 'arkadiko-auction-engine-v3-1',
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
          contractName: 'arkadiko-auction-engine-v3-1',
          functionName: 'get-auction-by-id',
          functionArgs: [uintCV(auctionId.value)],
          senderAddress: stxAddress || '',
          network: network,
        });
        const json = cvToJSON(auction);

        const data = json.value;
        const isOpen = await auctionOpen(data['id'].value);
        if (isOpen && Number(data['collateral-amount'].value) > 0) {
          serializedAuctions.push({
            id: data['id'].value,
            lotId: data['lots-sold'].value,
            auctionType: data['auction-type'].value,
            collateralToken: data['collateral-token'].value,
            debt: '0',
            endsAt: data['ends-at'].value,
            vaultId: data['vault-id'].value,
          });
        }
      });

      const getLastBid = async (auctionId: number, lotId: number) => {
        const lastBid = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-auction-engine-v3-1',
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
        contractName: 'arkadiko-auction-engine-v3-1',
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
    }, resolveProvider() || window.StacksProvider);
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
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Trade xSTX for STX
                  </h3>
                </div>
              </header>
              <div className="mt-4">
                {state.balance['xstx'] > 0 ? (
                  <p className="mt-2">
                    There are {redeemableStx / 1000000} STX redeemable in the Arkadiko pool. <br />
                    You have {state.balance['xstx'] / 1000000} xSTX. <br />
                    <button
                      type="button"
                      onClick={() => redeemStx()}
                      className="mt-2 px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Redeem
                    </button>
                  </p>
                ) : (
                  <EmptyState Icon={CashIcon} title="You have no xSTX you can trade." />
                )}
              </div>
            </section>

            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Your Winning Lots
                  </h3>
                </div>
              </header>
              <div className="mt-4 mb-12">
                {lots.length > 0 ? (
                  <LotGroup lots={lots} />
                ) : loadingAuctions ? (
                  <Placeholder />
                ) : (
                  <EmptyState
                    Icon={GiftIcon}
                    title="You have no winning lots you can redeem."
                    description="Winning lots can be redeemed when the parent auction closes."
                  />
                )}
              </div>
            </section>

            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Liquidations
                  </h3>
                </div>
              </header>
              <div className="mt-4">
                <p className="mb-4 text-gray-900 dark:text-zinc-100">
                  Current Block Height: {stacksTipHeight}
                </p>
                {auctions.length > 0 ? (
                  <AuctionGroup auctions={auctions} stacksTipHeight={stacksTipHeight} />
                ) : loadingAuctions ? (
                  <Placeholder />
                ) : (
                  <EmptyState
                    Icon={DocumentSearchIcon}
                    title="There are currently no open auctions."
                  />
                )}
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
