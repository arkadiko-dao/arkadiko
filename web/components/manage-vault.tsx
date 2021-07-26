import React, { useContext, useEffect, useState } from 'react';
import { Box, Modal, Text } from '@blockstack/ui';
import { XIcon } from '@heroicons/react/outline';
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
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import BN from 'bn.js';
import { tokenList } from '@components/token-swap-list';
import { InputAmount } from './input-amount';

export const ManageVault = ({ match }) => {
  const { doContractCall } = useConnect();
  const senderAddress = useSTXAddress();
  const [state, setState] = useContext(AppContext);
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [extraCollateralDeposit, setExtraCollateralDeposit] = useState('');
  const [isLiquidated, setIsLiquidated] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [collateralToWithdraw, setCollateralToWithdraw] = useState('');
  const [maximumCollateralToWithdraw, setMaximumCollateralToWithdraw] = useState(0);
  const [usdToMint, setUsdToMint] = useState('');
  const [usdToBurn, setUsdToBurn] = useState('');
  const [reserveName, setReserveName] = useState('');
  const [vault, setVault] = useState<VaultProps>();
  const [price, setPrice] = useState(0);
  const [collateralType, setCollateralType] = useState<CollateralTypeProps>();
  const [isVaultOwner, setIsVaultOwner] = useState(false);
  const [stabilityFee, setStabilityFee] = useState(0);
  const [pendingVaultRewards, setPendingVaultRewards] = useState(0);
  const [closingVault, setClosingVault] = useState(false);

  useEffect(() => {
    const fetchVault = async () => {
      const serializedVault = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-freddie-v1-1",
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
          contractName: "arkadiko-collateral-types-v1-1",
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
          liquidationPenalty: json.value['liquidation-penalty'].value / 100,
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
    const fetchFees = async () => {
      const feeCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-freddie-v1-1",
        functionName: "get-stability-fee-for-vault",
        functionArgs: [
          uintCV(vault?.id),
          contractPrincipalCV(contractAddress || '', 'arkadiko-collateral-types-v1-1')
        ],
        senderAddress: contractAddress || '',
        network: network,
      });
      const fee = cvToJSON(feeCall);
      setStabilityFee(fee.value.value);

      const rewardCall = await callReadOnlyFunction({
        contractAddress,
        contractName: "arkadiko-vault-rewards-v1-1",
        functionName: "get-pending-rewards",
        functionArgs: [standardPrincipalCV(senderAddress || '')],
        senderAddress: contractAddress || '',
        network: network
      });
      const reward = cvToJSON(rewardCall);
      setPendingVaultRewards(reward.value.value / 1000000);
    };

    if (vault?.id) {
      fetchFees();
    }
  }, [vault]);

  useEffect(() => {
    if (vault && collateralType?.collateralToDebtRatio) {
      if (vault.stackedTokens === 0) {
        setMaximumCollateralToWithdraw(availableCollateralToWithdraw(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio));
      } else {
        setMaximumCollateralToWithdraw(0);
      }
    }
  }, [collateralType?.collateralToDebtRatio, price]);

  const payStabilityFee = async () => {
    const postConditions = [
      makeStandardFungiblePostCondition(
        senderAddress || '',
        FungibleConditionCode.GreaterEqual,
        new BN(stabilityFee),
        createAssetInfo(
          contractAddress,
          "usda-token",
          "usda"
        )
      )
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'pay-stability-fee',
      functionArgs: [
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1')
      ],
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished paying stability fee!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const callBurn = async () => {
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'burn',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(usdToBurn) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished burn!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowBurnModal(false);
      },
    });
  };
  let debtRatio = 0;
  if (match.params.id) {
    debtRatio = getCollateralToDebtRatio(match.params.id)?.collateralToDebt;
  }

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      if (closingVault) {
        window.location.href = '/vaults';
      } else {
        window.location.reload();
      }
    }
  }, [state.currentTxStatus]);

  const closeVault = async () => {
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'close-vault',
      functionArgs: [
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setClosingVault(true);
        setShowBurnModal(false);
      },
    });
  };

  const claimPendingRewards = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: "arkadiko-vault-rewards-v1-1",
      functionName: "claim-pending-rewards",
      functionArgs: [],
      postConditionMode: 0x01,
      finished: data => {
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

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
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'deposit',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(extraCollateralDeposit) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1')
      ],
      postConditionMode: 0x01,
      postConditions,
      finished: data => {
        console.log('finished deposit!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowDepositModal(false);
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
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'mint',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(usdToMint) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished mint!', data, data.txId);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowMintModal(false);
      },
    });
  };

  const callToggleStacking = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'toggle-stacking',
      functionArgs: [uintCV(match.params.id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished toggling stacking!', data, data.txId);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const stackCollateral = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'stack-collateral',
      functionArgs: [uintCV(match.params.id)],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished stacking!', data, data.txId);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
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
      stxAddress: senderAddress,
      contractName: "arkadiko-freddie-v1-1",
      functionName: 'withdraw',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(collateralToWithdraw) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished withdraw!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
        setShowWithdrawModal(false);
      },
    });
  };

  const callNotifyRisky = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-liquidator-v1-1',
      functionName: 'notify-risky-vault',
      functionArgs: [
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-freddie-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-auction-engine-v1-1'),
        uintCV(match.params.id),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-collateral-types-v1-1'),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1')
      ],
      postConditionMode: 0x01,
      finished: data => {
        console.log('finished notify risky reserve!', data);
        setState(prevState => ({ ...prevState, currentTxId: data.txId, currentTxStatus: 'pending' }));
      },
    });
  };

  const depositMaxAmount = () => {
    setExtraCollateralDeposit((state.balance['stx'] / 1000000) - 1);
  };

  const mintMaxAmount = () => {
    setUsdToMint(
      availableCoinsToMint(
        price,
        collateralLocked(),
        outstandingDebt(),
        collateralType?.collateralToDebtRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }
      )
    );
  };
  
  const burnMaxAmount = () => {
    setUsdToBurn(outstandingDebt());
  };

  return (
    <Container>
      {auctionEnded && <Redirect to="/vaults" />}

      <Modal isOpen={showDepositModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowDepositModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-full">
              <img className="h-10 w-10 rounded-full" src={tokenList[2].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Deposit Extra Collateral
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much extra collateral you want to post. You have a balance of {state.balance['stx'] / 1000000} {vault?.collateralToken.toUpperCase()}.
                  </p>
                  <p className="text-sm text-gray-500">
                    We will automatically harvest any DIKO you are eligible for when depositing.
                  </p>

                  <div className="mt-6">
                    <InputAmount
                      balance={(state.balance['stx'] / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      token={vault?.collateralToken.toUpperCase()}
                      inputName="depositCollateral"
                      inputId="depositExtraStxAmount"
                      inputValue={extraCollateralDeposit}
                      inputLabel="Deposit Extra Collateral"
                      onInputChange={onInputChange}
                      onClickMax={depositMaxAmount}
                    />
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => addDeposit()}
              >
                Add deposit
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowDepositModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showWithdrawModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowWithdrawModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-full">
              <img className="h-10 w-10 rounded-full" src={tokenList[1].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Withdraw Collateral
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much collateral you want to withdraw. You can withdraw a maximum of {maximumCollateralToWithdraw} {vault?.collateralToken.toUpperCase()}.
                  </p>
                  <p className="text-sm text-gray-500">
                    We will automatically harvest any DIKO you are eligible for when withdrawing.
                  </p>

                  <div className="mt-6">
                    <InputAmount
                      balance={maximumCollateralToWithdraw}
                      token={vault?.collateralToken.toUpperCase()}
                      inputName="withdrawCollateral"
                      inputId="withdrawCollateralAmount"
                      inputValue={collateralToWithdraw}
                      inputLabel="Withdraw Collateral"
                      onInputChange={onInputChange}
                      onClickMax={mintMaxAmount}
                    />
                  </div>

                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => callWithdraw()}
              >
                Withdraw
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowWithdrawModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMintModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowMintModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-full">
              <img className="h-10 w-10 rounded-full" src={tokenList[0].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Mint extra USDA
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much extra USDA you want to mint. You can mint a maximum of {availableCoinsToMint(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA.
                  </p>

                  <div className="mt-6">
                    <InputAmount
                      balance={availableCoinsToMint(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      token="USDA"
                      inputName="mintDebt"
                      inputId="mintUSDAAmount"
                      inputValue={usdToMint}
                      inputLabel="Mint USDA"
                      onInputChange={onInputChange}
                      onClickMax={mintMaxAmount}
                    />
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => callMint()}
              >
                Mint
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowMintModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBurnModal}>
        <div className="flex pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg px-2 pt-5 pb-4 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowBurnModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-full">
              <img className="h-10 w-10 rounded-full" src={tokenList[0].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Burn USDA
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose how much USDA you want to burn. If you burn all USDA, your vault will be closed.
                  </p>

                  <div className="mt-6">
                    <InputAmount
                      balance={(state.balance['usda'] / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      token="USDA"
                      inputName="burnDebt"
                      inputId="burnAmount"
                      inputValue={usdToBurn}
                      inputLabel="Burn USDA"
                      onInputChange={onInputChange}
                      onClickMax={burnMaxAmount}
                    />
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => callBurn()}
              >
                Burn
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowBurnModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Box py={6}>
        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <h1 className="text-2xl leading-6 font-medium text-gray-900 mb-4">
              {vault?.collateralToken.toUpperCase()}/USDA Vault #{match.params.id}
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
                  Outstanding USDA debt
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
                          Outstanding USDA debt
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          {outstandingDebt().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA
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
                          Outstanding Stability Fees
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                        ${(stabilityFee / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA
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
                    <hr/>

                    <div className="mt-5 sm:flex sm:items-start sm:justify-between mb-5">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Total Outstanding Debt
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          ${(outstandingDebt() + stabilityFee / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            <Text onClick={() => closeVault()}
                                  _hover={{ cursor: 'pointer'}}
                                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Close Vault
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
                          {availableCoinsToMint(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDA
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

                  </div>
                </div>
              </li>
            </ul>

            <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-8">
              <li className="relative col-span-2 flex shadow-sm rounded-md">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mt-8 mb-4">
                  DIKO Vault Rewards
                </h2>
              </li>
            </ul>

            <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <li className="relative col-span-2 flex shadow-sm rounded-md">
                <div className="bg-white shadow sm:rounded-lg w-full">
                  <div className="px-4 py-5 sm:p-6">
                      
                    <div className="mt-5 sm:flex sm:items-start sm:justify-between mb-5">
                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          Unclaimed DIKO rewards
                        </p>
                      </div>

                      <div className="max-w-xl text-sm text-gray-500">
                        <p>
                          {pendingVaultRewards.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} DIKO
                        </p>
                      </div>

                      {isVaultOwner ? (
                        <div className="max-w-xl text-sm text-gray-500">
                          <p>
                            <Text onClick={() => claimPendingRewards()}
                                  _hover={{ cursor: 'pointer'}}
                                  className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Claim
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
