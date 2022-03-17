import React, { useEffect, useContext, useState } from 'react';
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
  uintCV,
} from '@stacks/transactions';

export const LiquidationFund = () => {
  const [state, setState] = useContext(AppContext);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  const [depositAmount, setDepositAmount] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  useEffect(() => {}, []);

  const onInputChange = (event: any) => {
    const value = event.target.value;
    console.log('Value changed: ', value);
    setDepositAmount(value);

    setInsufficientFunds(false);
    if (value > state.balance['stx'] / 1000000) {
      setInsufficientFunds(true);
    }
  };

  const onMaxPressed = (event: any) => {
    const value = event.target.value;
    console.log('Value changed: ', value);
    setDepositAmount(state.balance['stx'] / 1000000 - 1);
  };

  const deposit = async () => {
    const postConditions = [
      makeStandardSTXPostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        Number(depositAmount) * 1000000
      ),
    ];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-liquidation-fund-v1-1',
      functionName: 'deposit-stx',
      functionArgs: [uintCV(Number(depositAmount) * 1000000)],
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
              <div className="flex flex-col items-center justify-center flex-1 py-12">
                <div className="relative w-full max-w-lg">
                  <div className="absolute top-0 bg-indigo-400 rounded-full -left-8 w-80 h-80 mix-blend-multiply filter blur-xl opacity-70"></div>
                  <div className="absolute bg-indigo-200 rounded-full -bottom-16 opacity-70 -right-16 w-80 h-80 mix-blend-multiply filter blur-xl"></div>

                  <div className="relative p-4 bg-white rounded-lg">
                    <h2 className="text-2xl font-headings">Liquidation Fund</h2>
                    <p className="mt-4 text-gray-800">
                      Deposited STX will be used to provide STX/USDA liquidity and stake the LP
                      tokens. Funds can be used by the controller to perform liquidations and
                      participate in auctions.
                    </p>

                    <div className="mt-6">
                      <InputAmount
                        balance={state.balance['stx'] / 1000000}
                        token="STX"
                        inputName={`deposit`}
                        inputId={`unstakeAmount`}
                        inputValue={depositAmount}
                        inputLabel={`Deposit to liquidation fund`}
                        onInputChange={onInputChange}
                        onClickMax={onMaxPressed}
                        autoFocus
                      />

                      <button
                        type="button"
                        disabled={insufficientFunds || depositAmount === 0}
                        onClick={() => deposit()}
                        className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                      >
                        {insufficientFunds
                          ? 'Insufficient funds'
                          : depositAmount === 0
                          ? 'Please enter an amount'
                          : 'Deposit'}
                      </button>
                    </div>
                  </div>
                </div>
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
