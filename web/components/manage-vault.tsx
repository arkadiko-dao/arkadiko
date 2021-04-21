import React, { useContext, useEffect, useState } from 'react';
import { Box, Modal, Text } from '@blockstack/ui';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import {
  uintCV, stringAsciiCV, contractPrincipalCV, cvToJSON,
  standardPrincipalCV, callReadOnlyFunction, makeStandardFungiblePostCondition,
  createAssetInfo, FungibleConditionCode, makeStandardSTXPostCondition } from '@stacks/transactions';
import { AppContext, CollateralTypeProps } from '@common/context';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { debtClass, VaultProps } from './vault';
import { getPrice } from '@common/get-price';
import { getLiquidationPrice, availableCollateralToWithdraw, availableCoinsToMint } from '@common/vault-utils';
import { Link } from '@components/link';
import { Redirect } from 'react-router-dom';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import BN from 'bn.js';

export const ManageVault = ({ match }) => {
  const { doContractCall } = useConnect();
  const senderAddress = useSTXAddress();
  const state = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [extraCollateralDeposit, setExtraCollateralDeposit] = useState('');
  const [isLiquidated, setIsLiquidated] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [txId, setTxId] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');
  const [collateralToWithdraw, setCollateralToWithdraw] = useState('');
  const [maximumCollateralToWithdraw, setMaximumCollateralToWithdraw] = useState(0);
  const [usdToMint, setUsdToMint] = useState('');
  const [usdToBurn, setUsdToBurn] = useState('');
  const [reserveName, setReserveName] = useState('');
  const [vault, setVault] = useState<VaultProps>();
  const [price, setPrice] = useState(0);
  const [collateralType, setCollateralType] = useState<CollateralTypeProps>();
  const [isVaultOwner, setIsVaultOwner] = useState(false);

  useEffect(() => {
    const fetchVault = async () => {
      const serializedVault = await callReadOnlyFunction({
        contractAddress,
        contractName: "freddie",
        functionName: "get-vault-by-id",
        functionArgs: [uintCV(match.params.id)],
        senderAddress: senderAddress || '',
        network: network,
      });
      const data = cvToJSON(serializedVault).value;

      if (data['id'].value !== 0) {
        setVault({
          id: data['id'].value,
          owner: data['owner'].value,
          collateral: data['collateral'].value,
          collateralType: data['collateral-type'].value,
          collateralToken: data['collateral-token'].value,
          stabilityFee: data['stability-fee'].value,
          isLiquidated: data['is-liquidated'].value,
          auctionEnded: data['auction-ended'].value,
          leftoverCollateral: data['leftover-collateral'].value,
          debt: data['debt'].value,
          stackedTokens: data['stacked-tokens'].value,
          revokedStacking: data['revoked-stacking'].value,
          collateralData: {},
        });
        setReserveName(resolveReserveName(data['collateral-token'].value));
        setIsLiquidated(data['is-liquidated'].value);
        setAuctionEnded(data['auction-ended'].value);
        setIsVaultOwner(data['owner'].value === senderAddress);

        let price = await getPrice(data['collateral-token'].value);
        setPrice(price);

        const type = await callReadOnlyFunction({
          contractAddress,
          contractName: "collateral-types",
          functionName: "get-collateral-type-by-name",
          functionArgs: [stringAsciiCV(data['collateral-type'].value)],
          senderAddress: senderAddress || '',
          network: network,
        });
        const json = cvToJSON(type.value);
        setCollateralType({
          name: json.value['name'].value,
          token: json.value['token'].value,
          tokenType: json.value['token-type'].value,
          url: json.value['url'].value,
          totalDebt: json.value['total-debt'].value,
          collateralToDebtRatio: json.value['collateral-to-debt-ratio'].value,
          liquidationPenalty: json.value['liquidation-penalty'].value,
          liquidationRatio: json.value['liquidation-ratio'].value,
          maximumDebt: json.value['maximum-debt'].value,
          stabilityFee: json.value['stability-fee'].value,
          stabilityFeeApy: json.value['stability-fee-apy'].value
        });
      }
    }

    fetchVault();
  }, [match.params.id]);

  useEffect(() => {
    if (vault && collateralType?.collateralToDebtRatio) {
      if (vault.stackedTokens === 0) {
        setMaximumCollateralToWithdraw(availableCollateralToWithdraw(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio));
      } else {
        setMaximumCollateralToWithdraw(0);
      }
    }
  }, [collateralType?.collateralToDebtRatio, price]);

  useEffect(() => {
    let sub;

    const subscribe = async (txId:string) => {
      const client = await connectWebSocketClient('ws://localhost:3999');
      sub = await client.subscribeTxUpdates(txId, update => {
        console.log('Got an update:', update);
        if (update['tx_status'] == 'success') {
          window.location.reload(true);
        } else if (update['tx_status'] == 'abort_by_response') {
          setTxStatus('error');
        }
      });
      console.log({ client, sub });
    };
    if (txId) {
      console.log('Subscribing on updates with TX id:', txId);
      subscribe(txId);
      setShowDepositModal(false);
    }
  }, [txId]);

  const payStabilityFee = async () => {
    // const postConditions = [
    //   makeStandardFungiblePostCondition(
    //     senderAddress || '',
    //     FungibleConditionCode.Equal,
    //     new BN(vault.stabilityFee),
    //     createAssetInfo(
    //       "CONTRACT_ADDRESS",
    //       "xusd-token",
    //       "xUSD"
    //     )
    //   )
    // ];

    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'pay-stability-fee',
      functionArgs: [
        uintCV(match.params.id)
      ],
      postConditionMode: 0x01,
      // postConditions,
      finished: data => {
        console.log('finished paying stability fee!', data);
        setTxId(data.txId);
        setTxStatus('pending');
      },
    });
  };

  const callBurn = async () => {
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];

    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'burn',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(usdToBurn) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished burn!', data);
        setTxId(data.txId);
        setTxStatus('pending');
        setShowBurnModal(false);
      },
    });
  };
  let debtRatio = 0;
  if (match.params.id) {
    debtRatio = getCollateralToDebtRatio(match.params.id)?.collateralToDebt;
  }

  const addDeposit = async () => {
    if (!extraCollateralDeposit) {
      return;
    }
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];

    let postConditions = [];
    if (vault['collateralToken'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(
          senderAddress || '',
          FungibleConditionCode.Equal,
          new BN(parseFloat(extraCollateralDeposit) * 1000000)
        )
      ];
    } else {
      // postConditions = [
      //   makeStandardFungiblePostCondition(
      //     senderAddress || '',
      //     FungibleConditionCode.Equal,
      //     new BN(parseFloat(extraCollateralDeposit) * 1000000),
      //     createAssetInfo(
      //       "CONTRACT_ADDRESS",
      //       token,
      //       vault['collateralToken'].toUpperCase()
      //     )
      //   )
      // ];
    }

    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'deposit',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(extraCollateralDeposit) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token)
      ],
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished deposit!', data);
        setTxId(data.txId);
        setTxStatus('pending');
      },
    });
  };

  const liquidationPrice = () => {
    if (vault) {
      // (liquidationRatio * coinsMinted) / collateral = rekt
      return getLiquidationPrice(collateralType?.liquidationRatio, vault['debt'], vault['collateral']);
    }

    return 0;
  }

  const collateralLocked = () => {
    if (vault) {
      return vault['collateral'] / 1000000;
    }

    return 0;
  }

  const outstandingDebt = () => {
    if (vault) {
      return vault.debt / 1000000;
    }

    return 0;
  }

  const onInputChange = (event: { target: { value: any, name: any; }; }) => {
    const value = event.target.value;
    if (event.target.name === 'depositCollateral') {
      setExtraCollateralDeposit(value);
    } else if (event.target.name === 'mintDebt') {
      setUsdToMint(value);
    } else if (event.target.name === 'burnDebt') {
      setUsdToBurn(value);
    } else {
      setCollateralToWithdraw(value);
    }
  };

  const callMint = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'mint',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(usdToMint) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished mint!', data, data.txId);
        setTxId(data.txId);
        setTxStatus('pending');
        setShowMintModal(false);
      },
    });
  };

  const callToggleStacking = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'toggle-stacking',
      functionArgs: [uintCV(match.params.id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished toggling stacking!', data, data.txId);
        setTxId(data.txId);
        setTxStatus('pending');
      },
    });
  };

  const stackCollateral = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'stack-collateral',
      functionArgs: [uintCV(match.params.id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished stacking!', data, data.txId);
        setTxId(data.txId);
        setTxStatus('pending');
      },
    });
  };

  const callWithdraw = async () => {
    if (parseFloat(collateralToWithdraw) > maximumCollateralToWithdraw) {
      return;
    }

    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    await doContractCall({
      network,
      contractAddress,
      contractName: 'freddie',
      functionName: 'withdraw',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(collateralToWithdraw) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token)
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished withdraw!', data);
        setTxId(data.txId);
        setTxStatus('pending');
        setShowWithdrawModal(false);
      },
    });
  };

  const callNotifyRisky = async () => {
    await doContractCall({
      network,
      contractAddress,
      contractName: 'liquidator',
      functionName: 'notify-risky-vault',
      functionArgs: [uintCV(match.params.id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished notify risky reserve!', data);
        setTxId(data.txId);
        setTxStatus('pending');
      },
    });
  };

  return (
    <Container>
      {auctionEnded && <Redirect to="/vaults" />}

      {txId ? (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end">
          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    Successfully broadcasted transaction!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Status: {txStatus}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    This page will be reloaded automatically when the transaction succeeds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null }

      <Modal isOpen={showDepositModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Deposit Extra Collateral
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much extra collateral you want to post. You have a balance of {state.balance['stx'] / 1000000} {vault?.collateralToken.toUpperCase()}.
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    </div>
                    <input type="text" name="depositCollateral" id="collateralAmount"
                           value={extraCollateralDeposit}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="collateral-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="collateral-currency">
                        {vault?.collateralToken.toUpperCase()}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => addDeposit()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Add deposit
              </button>

              <button type="button" onClick={() => setShowDepositModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showWithdrawModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Withdraw Collateral
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much collateral you want to withdraw. You can withdraw a maximum of {maximumCollateralToWithdraw} {vault?.collateralToken.toUpperCase()}.
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    </div>
                    <input type="text" name="withdrawCollateral" id="withdrawCollateralAmount"
                           value={collateralToWithdraw}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="collateral-withdraw-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="collateral-withdraw-currency">
                        {vault?.collateralToken.toUpperCase()}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => callWithdraw()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Withdraw
              </button>

              <button type="button" onClick={() => setShowWithdrawModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMintModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Mint extra xUSD
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much extra xUSD you want to mint. You can mint a maximum of {availableCoinsToMint(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio)} {vault?.collateralToken.toUpperCase()}.
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    </div>
                    <input type="text" name="mintDebt" id="mintAmount"
                           value={usdToMint}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="collateral-mint-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="collateral-mint-currency">
                        {vault?.collateralToken.toUpperCase()}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => callMint()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Mint
              </button>

              <button type="button" onClick={() => setShowMintModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBurnModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Burn xUSD
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much xUSD you want to burn. If you burn all xUSD, your vault will be closed.
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      $
                    </div>
                    <input type="text" name="burnDebt" id="burnAmount"
                           value={usdToBurn}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="collateral-burn-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="collateral-burn-currency">
                        xUSD
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button type="button" onClick={() => callBurn()} className="mb-5 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                Burn
              </button>

              <button type="button" onClick={() => setShowBurnModal(false)} className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Box py={6}>
        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <h1 className="text-2xl leading-6 font-medium text-gray-900 mb-4">
              {vault?.collateralToken.toUpperCase()}/xUSD Vault #{match.params.id}
            </h1>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                Liquidation Price
              </h2>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                Collateral to Debt Ratio
              </h2>
              <Link onClick={() => callNotifyRisky()} color="blue" display="inline-block" mt={8} ml={5}>
                (Notify Vault as Risky)
              </Link>
            </li>
          </ul>

          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    ${liquidationPrice()} USD ({vault?.collateralToken.toUpperCase()}/USD)
                  </h2>
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Current Price Information
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        ${price / 100} USD
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Liquidation Penalty
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        {collateralType?.liquidationPenalty}%
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className={`text-lg leading-6 font-medium ${debtClass(collateralType?.liquidationRatio, debtRatio)}`}>
                    {debtRatio}%
                  </h2>
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Minimum Ratio (before liquidation)
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                      {collateralType?.liquidationRatio}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Stability Fee
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        {collateralType?.stabilityFeeApy / 100}%
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>
          </ul>





          {isLiquidated ? auctionEnded ? (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-1 xl:grid-cols-1 mt-8">
                <li className="relative col-span-1 flex shadow-sm rounded-md">
                  <h2 className="text-lg text-center leading-6 font-medium text-gray-900 mt-8 mb-4">
                    Your vault got liquidated. An auction ran and there is some leftover collateral
                  </h2>

                  <div className="max-w-xl text-sm text-gray-500">
                    {isVaultOwner ? (
                      <p>
                        <Text onClick={() => callWithdraw()}
                              _hover={{ cursor: 'pointer'}}
                              className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          Withdraw Leftover Collateral
                        </Text>
                      </p>
                    ): null }
                  </div>
                </li>
              </ul>
            </>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-8">
                <li className="relative col-span-2 flex shadow-sm rounded-md">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                    Vault got liquidated. Running auction...
                  </h2>
                </li>
              </ul>
            </>
          ) : (
            <>
            <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-8">
              <li className="relative col-span-2 flex shadow-sm rounded-md">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                  {vault?.collateralToken.toUpperCase()} Locked
                </h2>
              </li>

              <li className="relative col-span-2 flex shadow-sm rounded-md">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                  Outstanding xUSD debt
                </h2>
              </li>
            </ul>

            <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <li className="relative col-span-2 flex shadow-sm rounded-md">
                <div className="bg-white shadow sm:rounded-lg w-full">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between mb-10">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                        {vault?.collateralToken.toUpperCase()} Locked
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>
                          {collateralLocked()} {vault?.collateralToken.toUpperCase()}
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            <Text onClick={() => setShowDepositModal(true)}
                                  _hover={{ cursor: 'pointer'}}
                                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Deposit
                            </Text>
                          </p>
                        </div>
                      ) : null }
                    </div>
                    <hr/>

                    <div className="mt-8 sm:flex sm:items-start sm:justify-between">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Able to withdraw
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>
                          {maximumCollateralToWithdraw} {vault?.collateralToken.toUpperCase()}
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            {maximumCollateralToWithdraw > 0 ? (
                              <Text onClick={() => setShowWithdrawModal(true)}
                                    _hover={{ cursor: 'pointer'}}
                                    className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Withdraw
                              </Text>
                            ) : null}
                          </p>
                        </div>
                      ) : null }
                    </div>

                    {isVaultOwner && vault?.stackedTokens > 0 && !vault?.revokedStacking ? (
                      <div className="mt-8 sm:flex sm:items-start sm:justify-between">
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            You cannot withdraw your collateral since it is stacked until this 2-week cycle ends. <br/>
                            Unstack your collateral to unlock it for withdrawal.
                          </p>
                        </div>

                        <div className="max-w-xl text-sm text-gray-500">
                          {isVaultOwner ? (
                            <p>
                              <Text onClick={() => callToggleStacking()}
                                    _hover={{ cursor: 'pointer'}}
                                    className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Unstack
                              </Text>
                            </p>
                           ) : null }
                        </div>
                      </div>
                    ) : isVaultOwner && vault?.stackedTokens > 0 && vault?.revokedStacking ? (
                      <div className="mt-8 sm:flex sm:items-start sm:justify-between">
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            You cannot withdraw your collateral since it is stacked until this 2-week cycle ends. <br/>
                            You have unstacked your collateral, so it will be unlocked for withdrawal soon.
                          </p>
                        </div>

                        <div className="max-w-xl text-sm text-gray-500">
                          {isVaultOwner ? (
                            <p>
                              <Text onClick={() => callToggleStacking()}
                                    _hover={{ cursor: 'pointer'}}
                                    className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Restack
                              </Text>
                            </p>
                          ) : null }
                        </div>
                      </div>
                    ) : isVaultOwner ? (
                      <div className="mt-8 sm:flex sm:items-start sm:justify-between">
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            You are not stacking your collateral.
                          </p>
                        </div>

                        <div className="max-w-xl text-sm text-gray-500">
                          {isVaultOwner ? (
                            <p>
                              <Text onClick={() => stackCollateral()}
                                    _hover={{ cursor: 'pointer'}}
                                    className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Stack
                              </Text>
                            </p>
                          ) : null }
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>

              <li className="relative col-span-2 flex shadow-sm rounded-md">
                <div className="bg-white shadow sm:rounded-lg w-full">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between mb-5">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Outstanding xUSD debt
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          {outstandingDebt()} xUSD
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            <Text onClick={() => setShowBurnModal(true)}
                                  _hover={{ cursor: 'pointer'}}
                                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Pay back
                            </Text>
                          </p>
                        </div>
                      ) : null }
                    </div>
                    <hr/>

                    <div className="mt-5 sm:flex sm:items-start sm:justify-between mb-5">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Available to mint
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          {availableCoinsToMint(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio)} xUSD
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            <Text onClick={() => setShowMintModal(true)}
                                  _hover={{ cursor: 'pointer'}}
                                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Mint
                            </Text>
                          </p>
                        </div>
                      ) : null }
                    </div>
                    <hr/>

                    <div className="mt-5 sm:flex sm:items-start sm:justify-between">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Outstanding Stability Fees
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                        ${vault?.stabilityFee / 1000000} xUSD
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            <Text onClick={() => payStabilityFee()}
                                  _hover={{ cursor: 'pointer'}}
                                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Pay back
                            </Text>
                          </p>
                        </div>
                      ) : null }
                    </div>

                  </div>
                </div>
              </li>
            </ul>
            </>
          )}

        </main>
      </Box>
    </Container>
  )
};
