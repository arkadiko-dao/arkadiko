import React, { useContext, useEffect, useState } from 'react';
import { Box, Modal, Text } from '@blockstack/ui';
import { Container } from './home';
import { getAuthOrigin, stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import { uintCV, standardPrincipalCV } from '@stacks/transactions';
import { AppContext } from '@common/context';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { debtClass } from './vault';
import { getStxPrice } from '@common/get-stx-price';
import { getLiquidationPrice, availableStxToWithdraw, availableCoinsToMint } from '@common/vault-utils';
import { Link } from '@components/link';
import { Redirect } from 'react-router-dom';

export const ManageVault = ({ match }) => {
  const { doContractCall } = useConnect();
  const senderAddress = useSTXAddress();
  const state = useContext(AppContext);
  const price = parseFloat(getStxPrice().price);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [extraStxDeposit, setExtraStxDeposit] = useState('');
  const [isLiquidated, setIsLiquidated] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);

  const searchVault = (id: string) => {
    for (let i = 0; i < state.vaults.length; i++) {
      let vault = state.vaults[i];
      if (vault.id === parseInt(id, 10)) {
        return vault;
      }
    }

    return null;
  }
  const vault = searchVault(match.params.id);

  useEffect(() => {
    let mounted = true;

    if (mounted && vault) {
      setIsLiquidated(vault['is-liquidated']);
      setAuctionEnded(vault['auction-ended']);
    }
    return () => { mounted = false; }
  }, [vault]);

  const callBurn = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'burn',
      functionArgs: [uintCV(match.params.id), standardPrincipalCV(senderAddress || '')],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished burn!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
        window.location.href = '/';
      },
    });
  };
  let debtRatio = 0;
  if (match.params.id) {
    debtRatio = getCollateralToDebtRatio(match.params.id)?.collateralToDebt;
  }

  const addDeposit = async () => {
    if (!extraStxDeposit) {
      return;
    }

    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'deposit',
      functionArgs: [uintCV(match.params.id), uintCV(parseFloat(extraStxDeposit) * 1000000)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished deposit!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
      },
    });
  };

  const liquidationPrice = () => {
    if (vault) {
      // (liquidationRatio * coinsMinted) / stxCollateral = rekt
      const liquidationRatio = parseInt(state.riskParameters['liquidation-ratio'], 10);
      return getLiquidationPrice(liquidationRatio, vault['debt'], vault['collateral']);
    }

    return 0;
  }

  const stxLocked = () => {
    if (vault) {
      return parseInt(vault['collateral'], 10) / 1000000;
    }

    return 0;
  }

  const outstandingDebt = () => {
    if (vault) {
      return parseInt(vault['debt'], 10) / 1000000;
    }

    return 0;
  }

  const onInputChange = (event) => {
    const value = event.target.value;
    setExtraStxDeposit(value);
  };

  const callMint = async () => {
    const value = availableCoinsToMint(price, stxLocked(), outstandingDebt(), state.riskParameters['collateral-to-debt-ratio'])

    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'mint',
      functionArgs: [uintCV(match.params.id), uintCV(parseFloat(value) * 1000000)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished mint!', data);
        console.log(data.stacksTransaction.auth.spendingCondition?.nonce.toNumber());
      },
    });
  };

  const callWithdraw = async () => {
    const value = availableStxToWithdraw(price, stxLocked(), outstandingDebt(), state.riskParameters['collateral-to-debt-ratio']);

    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'freddie',
      functionName: 'withdraw',
      functionArgs: [uintCV(match.params.id), uintCV(parseFloat(value) * 1000000)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished withdraw!', data);
      },
    });
  };

  const callNotifyRisky = async () => {
    const authOrigin = getAuthOrigin();
    await doContractCall({
      network,
      authOrigin,
      contractAddress: 'ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP',
      contractName: 'liquidator',
      functionName: 'notify-risky-vault',
      functionArgs: [uintCV(match.params.id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished notify risky reserve!', data);
      },
    });
  };

  return (
    <Container>
      {auctionEnded && <Redirect to="/vaults" />}

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
                    Choose how much extra collateral you want to post. You have a balance of {state.balance['stx'] / 1000000} STX.
                  </p>

                  <div className="mt-4 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    </div>
                    <input type="text" name="stx" id="stxAmount"
                           value={extraStxDeposit}
                           onChange={onInputChange}
                           className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                           placeholder="0.00" aria-describedby="stx-currency" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm" id="stx-currency">
                        STX
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

      <Box py={6}>
        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <h1 className="text-2xl leading-6 font-medium text-gray-900 mb-4">
              STX/xUSD Vault #{match.params.id}
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
                    ${liquidationPrice()} USD (STX/USD)
                  </h2>
                  <div className="mt-2 sm:flex sm:items-start sm:justify-between">
                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        Current Price Information
                      </p>
                    </div>

                    <div className="max-w-xl text-sm text-gray-500">
                      <p>
                        ${parseFloat(price / 100)} USD
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
                        {state.riskParameters['liquidation-penalty']}%
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </li>

            <li className="relative col-span-2 flex shadow-sm rounded-md">
              <div className="bg-white shadow sm:rounded-lg w-full">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className={`text-lg leading-6 font-medium ${debtClass(debtRatio)}`}>
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
                        {state.riskParameters['liquidation-ratio']}%
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
                        0.0%
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
                    <p>
                      <Text onClick={() => callWithdraw()}
                            _hover={{ cursor: 'pointer'}}
                            className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Withdraw Leftover Collateral
                      </Text>
                    </p>
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
                  STX Locked
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
                    <div className="mt-2 sm:flex sm:items-start sm:justify-between mb-5">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          STX Locked
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>
                          {stxLocked()} STX
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          <Text onClick={() => setShowDepositModal(true)}
                                _hover={{ cursor: 'pointer'}}
                                className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Deposit
                          </Text>
                        </p>
                      </div>
                    </div>
                    <hr/>

                    <div className="mt-5 sm:flex sm:items-start sm:justify-between">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Able to withdraw
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>
                          {availableStxToWithdraw(price, stxLocked(), outstandingDebt(), state.riskParameters['collateral-to-debt-ratio'])} STX
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          <Text onClick={() => callWithdraw()}
                                _hover={{ cursor: 'pointer'}}
                                className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Withdraw
                          </Text>
                        </p>
                      </div>
                    </div>

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

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          <Text onClick={() => callBurn()}
                                _hover={{ cursor: 'pointer'}}
                                className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Pay back
                          </Text>
                        </p>
                      </div>
                    </div>
                    <hr/>

                    <div className="mt-5 sm:flex sm:items-start sm:justify-between">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Available to mint
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          {availableCoinsToMint(price, stxLocked(), outstandingDebt(), state.riskParameters['collateral-to-debt-ratio'])} xUSD
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          <Text onClick={() => callMint()}
                                _hover={{ cursor: 'pointer'}}
                                className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Mint
                          </Text>
                        </p>
                      </div>
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
