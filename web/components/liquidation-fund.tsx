import React, { useEffect, useContext, useState, useRef } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';
import { InputAmount } from './input-amount';
import {
  AnchorMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  uintCV
} from '@stacks/transactions';

export const LiquidationFund = () => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const inputRef = useRef<HTMLInputElement>(null);
  const actionButtonRef = useRef(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  useEffect(() => {
  }, []);

  const onInputChange = (event: any) => {
    const value = event.target.value;
    console.log("Value changed: ", value);
    setDepositAmount(value)

    setInsufficientFunds(false);
    if (value > state.balance['stx'] / 1000000) {
      setInsufficientFunds(true);
    }
  };

  const onMaxPressed = (event: any) => {
    const value = event.target.value;
    console.log("Value changed: ", value);
    setDepositAmount(state.balance['stx'] / 1000000 - 1)
  };

  const deposit = async () => {
    const postConditions = [
      makeStandardSTXPostCondition(stxAddress || '', FungibleConditionCode.Equal, Number(depositAmount) * 1000000),
    ];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-fund-v1-1',
      functionName: 'deposit-stx',
      functionArgs: [
        uintCV(Number(depositAmount) * 1000000)
      ],
      postConditions,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="flex-1 py-12">
            <section>
              <header>
                <div className="bg-indigo-700 rounded-md">
                  <div className=" px-4 py-5 mx-auto text-center sm:py-5 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white font-headings sm:text-4xl">
                      <span className="block">Liquidation Fund</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-indigo-200">
                      Deposited STX will be used to provide STX/USDA liquidity and stake the LP tokens. <br/>
                      Funds can be used by the controller to perform liquidations and participate in auctions.
                    </p>
                  </div>
                </div>
              </header>

              <div className="mt-8">
                <header className="pb-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium leading-6 text-gray-900 font-headings">
                    Deposit
                  </h2>
                </header>

                <InputAmount
                  balance={state.balance['stx'] / 1000000}
                  token="STX"
                  inputName={`deposit`}
                  inputId={`unstakeAmount`}
                  inputValue={depositAmount}
                  inputLabel={`Deposit to liquidation fund`}
                  onInputChange={onInputChange}
                  onClickMax={onMaxPressed}
                  ref={inputRef}
                />

                {insufficientFunds ? (
                  <button
                    type="button"
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    onClick={() => deposit()}
                    disabled
                    ref={actionButtonRef}
                  >
                    Insufficient funds
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    onClick={() => deposit()}
                    ref={actionButtonRef}
                  >
                    Deposit
                  </button>
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
