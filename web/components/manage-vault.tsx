import React, { useContext, useEffect, useState } from 'react';
import { Text, Modal, Tooltip } from '@blockstack/ui';
import { XIcon } from '@heroicons/react/outline';
import { InformationCircleIcon } from '@heroicons/react/solid';
import { Switch } from '@headlessui/react';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { useSTXAddress } from '@common/use-stx-address';
import { useConnect } from '@stacks/connect-react';
import {
  AnchorMode, uintCV, stringAsciiCV, contractPrincipalCV, cvToJSON,
  standardPrincipalCV, callReadOnlyFunction, makeStandardFungiblePostCondition,
  createAssetInfo, FungibleConditionCode, makeStandardSTXPostCondition } from '@stacks/transactions';
import { AppContext, CollateralTypeProps } from '@common/context';
import { getCollateralToDebtRatio } from '@common/get-collateral-to-debt-ratio';
import { debtClass, VaultProps } from './vault';
import { getPrice } from '@common/get-price';
import { getLiquidationPrice, availableCollateralToWithdraw, availableCoinsToMint } from '@common/vault-utils';
import { Redirect } from 'react-router-dom';
import { resolveReserveName, tokenTraits } from '@common/vault-utils';
import BN from 'bn.js';
import { tokenList } from '@components/token-swap-list';
import { InputAmount } from './input-amount';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

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
  const [enabledStacking, setEnabledStacking] = useState(true)

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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
      anchorMode: AnchorMode.Any
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
        <div className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block px-2 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowDepositModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-center mx-auto rounded-full">
              <img className="w-10 h-10 rounded-full" src={tokenList[2].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
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
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => addDeposit()}
              >
                Add deposit
              </button>
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowDepositModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showWithdrawModal}>
        <div className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block px-2 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowWithdrawModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-center mx-auto rounded-full">
              <img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
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
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => callWithdraw()}
              >
                Withdraw
              </button>
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowWithdrawModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMintModal}>
        <div className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block px-2 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowMintModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-center mx-auto rounded-full">
              <img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
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
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => callMint()}
              >
                Mint
              </button>
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowMintModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBurnModal}>
        <div className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block px-2 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowBurnModal(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-center mx-auto rounded-full">
              <img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900 font-headings" id="modal-headline">
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
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => callBurn()}
              >
                Burn
              </button>
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setShowBurnModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <main className="flex-1 py-12">
        <section>
          <header className="pb-5 border-b border-gray-200">
            <h2 className="text-xl font-medium leading-6 text-gray-900">
              {vault?.collateralToken.toUpperCase()}/USDA Vault #{match.params.id}
            </h2>
          </header>
          
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Supply
                </h3>
                <div className="sm:h-full mt-4 divide-y divide-gray-200 shadow sm:rounded-md sm:overflow-hidden sm:min-h-[480px]">
                  <div className="px-4 py-5 space-y-6 bg-white divide-y divide-gray-200 sm:h-full sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xl font-semibold leading-none">{collateralLocked()} <span className="text-sm font-normal">{vault?.collateralToken.toUpperCase()}</span></p>
                        <p className="text-base font-normal leading-6 text-gray-500">{vault?.collateralToken.toUpperCase()} Locked</p>
                      </div>

                      {isVaultOwner ? (
                        <button 
                          type="button" 
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => setShowDepositModal(true)}>
                          Deposit
                        </button>
                      ) : null }
                    </div>
                    <div className="pt-6">
                      <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xl font-semibold leading-none">{maximumCollateralToWithdraw} <span className="text-sm font-normal">{vault?.collateralToken.toUpperCase()}</span></p>
                          <p className="text-base font-normal leading-6 text-gray-500">Able to withdraw</p>
                        </div>

                        {/* We should hide the button if it's not possible to withdraw */}
                        {/* {isVaultOwner ? (
                          <button 
                            type="button" 
                            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowWithdrawModal(true)}>
                            Withdraw
                          </button>
                        ) : null } */}
                      </div>
                      
                      {isVaultOwner && vault?.stackedTokens > 0 && !vault?.revokedStacking ? (
                        <div className="p-4 mt-4 rounded-md bg-blue-50">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <InformationCircleIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1 ml-3 md:flex md:justify-between">
                              <p className="text-sm text-blue-700">You cannot withdraw your collateral since it is stacked until this 2-week cycle ends. Unstack your collateral to unlock it for withdrawal.</p>
                                {isVaultOwner ? (
                                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                                  <button 
                                    type="button" 
                                    className="font-medium text-blue-700 whitespace-nowrap hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => callToggleStacking()}>
                                    Unstack <span aria-hidden="true">&rarr;</span>
                                  </button>
                                </p>
                              ) : null }
                            </div>
                          </div>
                        </div>
                      ) : isVaultOwner && vault?.stackedTokens > 0 && vault?.revokedStacking ? (
                        <div className="p-4 mt-4 rounded-md bg-blue-50">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <InformationCircleIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1 ml-3 md:flex md:justify-between">
                              <p className="text-sm text-blue-700">You cannot withdraw your collateral since it is stacked until this 2-week cycle ends. You have unstacked your collateral, so it will be unlocked for withdrawal soon.</p>
                                {isVaultOwner ? (
                                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                                  <button 
                                    type="button" 
                                    className="font-medium text-blue-700 whitespace-nowrap hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => callToggleStacking()}>
                                    Restack <span aria-hidden="true">&rarr;</span>
                                  </button>
                                </p>
                              ) : null }
                            </div>
                          </div>
                        </div>
                      ) : isVaultOwner ? (
                        <div className="p-4 mt-4 rounded-md bg-blue-50">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <InformationCircleIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1 ml-3 md:flex md:justify-between">
                              <p className="text-sm text-blue-700">You are not stacking your collateral.</p>
                                {isVaultOwner ? (
                                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                                  <button 
                                    type="button" 
                                    className="font-medium text-blue-700 whitespace-nowrap hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => stackCollateral()}>
                                    Unstack <span aria-hidden="true">&rarr;</span>
                                  </button>
                                </p>
                              ) : null }
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                     <div className="pt-6">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xl font-semibold leading-none">Stacking</p>
                            <p className="text-base font-normal leading-6 text-green-500">Enabled</p>
                          </div>

                          <Switch
                            checked={enabledStacking}
                            onChange={setEnabledStacking}
                            className={classNames(
                              enabledStacking ? 'bg-indigo-600' : 'bg-gray-200',
                              'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            )}
                          >
                            <span className="sr-only">Use setting</span>
                            <span
                              className={classNames(
                                enabledStacking ? 'translate-x-5' : 'translate-x-0',
                                'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                              )}
                            >
                              <span
                                className={classNames(
                                  enabledStacking ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
                                  'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
                                )}
                                aria-hidden="true"
                              >
                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                                  <path
                                    d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span
                                className={classNames(
                                  enabledStacking ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
                                  'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
                                )}
                                aria-hidden="true"
                              >
                                <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                                </svg>
                              </span>
                            </span>
                          </Switch>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xl font-semibold leading-none">{collateralLocked()} <span className="text-sm font-normal">{vault?.collateralToken.toUpperCase()}</span></p>
                            <p className="text-base font-normal leading-6 text-gray-500">Currently stacking</p>
                          </div>
                          <div>
                            <p className="text-xl font-semibold leading-none">20/07/2021<span className="text-sm font-normal"> (5 days)</span></p>
                            <p className="text-base font-normal leading-6 text-gray-500">End of cycle</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Mint
                </h3>
                <div className="sm:h-full mt-4 divide-y divide-gray-200 shadow sm:rounded-md sm:overflow-hidden sm:min-h-[480px]">
                  <div className="relative px-4 py-5 space-y-6 bg-white divide-y divide-gray-200 sm:h-full sm:p-6">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xl font-semibold leading-none">{availableCoinsToMint(price, collateralLocked(), outstandingDebt(), collateralType?.collateralToDebtRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-sm font-normal">USDA</span></p>
                          <p className="text-base font-normal leading-6 text-gray-500">Available to mint</p>
                        </div>
                        {isVaultOwner ? (
                          <button 
                            type="button" 
                            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowMintModal(true)}>
                            Mint
                          </button>
                        ) : null }
                      </div>

                      <div className="mt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xl font-semibold leading-none">{outstandingDebt().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-sm font-normal">USDA</span></p>
                            <p className="flex items-center text-base font-normal leading-6 text-gray-500">
                              Outstanding USDA debt 
                              <Tooltip className="ml-2" shouldWrapChildren={true} label={`Includes a 4% yearly stability fee.`}>
                                <InformationCircleIcon className="block w-5 h-5 ml-2 text-gray-400" aria-hidden="true" />
                              </Tooltip>
                            </p>
                          </div>
                          {isVaultOwner ? (
                            <button 
                              type="button" 
                              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={() => setShowBurnModal(true)}>
                              Pay back
                            </button>
                          ) : null }
                        </div>
                      </div>
                    </div>
                    <div className="pt-6">
                      <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                          <p className={`text-xl font-semibold leading-none ${debtClass(collateralType?.liquidationRatio, debtRatio)}`}>
                            {debtRatio}<span className="text-sm font-normal">%</span>
                          </p>
                          <p className="text-base font-normal leading-6 text-gray-500">Collateral to Debt ratio</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xl font-semibold leading-none">
                            {collateralType?.liquidationRatio}<span className="text-sm font-normal">%</span>
                            </p>
                            <p className="text-base font-normal leading-6 text-gray-500">Minimum Ratio (before liquidation)</p>
                          </div>
                          <div>
                            <p className="text-xl font-semibold leading-none">
                            {collateralType?.liquidationPenalty}<span className="text-sm font-normal">%</span>
                            </p>
                            <p className="text-base font-normal leading-6 text-gray-500">Liquidation penalty</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 mt-4 md:mt-0 md:pt-0 md:absolute md:bottom-0 md:left-0">
                      <div className="px-4 py-6 rounded-md sm:rounded-none bg-blue-50">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <InformationCircleIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                          </div>
                          <div className="flex-1 ml-3 md:flex md:justify-between">
                            <p className="text-sm text-blue-700">The current STX price is <span className="font-semibold text-blue-900">${liquidationPrice()} USD</span>. You will be liquidated if the STX price drops below <span className="font-semibold text-blue-900">${price / 100} USD</span>. Pay back the outstanding debt or deposit extra collateral to keep your vault healthy.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>




      {/* <main className="relative z-0 flex-1 pb-8 overflow-y-auto">
        <div className="mt-8">
          <h1 className="mb-4 text-2xl font-medium leading-6 text-gray-900">
            {vault?.collateralToken.toUpperCase()}/USDA Vault #{match.params.id}
          </h1>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <li className="relative flex col-span-2 rounded-md shadow-sm">
            <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-gray-900">
              Liquidation Price
            </h2>
          </li>
          <li className="relative flex col-span-2 rounded-md shadow-sm">
            <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-gray-900">
              Collateral to Debt Ratio
            </h2>
            <Link onClick={() => callNotifyRisky()} color="blue" display="inline-block" mt={8} ml={5}>
              (Notify Vault as Risky)
            </Link>
          </li>
        </ul>
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <li className="relative flex col-span-2 rounded-md shadow-sm">
            <div className="w-full bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium leading-6 text-gray-900">
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
          <li className="relative flex col-span-2 rounded-md shadow-sm">
            <div className="w-full bg-white shadow sm:rounded-lg">
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
            <ul className="grid grid-cols-1 gap-4 mt-8 sm:gap-6 sm:grid-cols-1 xl:grid-cols-1">
              <li className="relative flex col-span-1 rounded-md shadow-sm">
                <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-center text-gray-900">
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
            <ul className="grid grid-cols-1 gap-4 mt-8 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <li className="relative flex col-span-2 rounded-md shadow-sm">
                <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-gray-900">
                  Vault got liquidated. Running auction...
                </h2>
              </li>
            </ul>
          </>
        ) : (
          <>
          <ul className="grid grid-cols-1 gap-4 mt-8 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative flex col-span-2 rounded-md shadow-sm">
              <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-gray-900">
                {vault?.collateralToken.toUpperCase()} Locked
              </h2>
            </li>
            <li className="relative flex col-span-2 rounded-md shadow-sm">
              <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-gray-900">
                Outstanding USDA debt
              </h2>
            </li>
          </ul>
          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative flex col-span-2 rounded-md shadow-sm">
              <div className="w-full bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="mt-2 mb-10 sm:flex sm:items-start sm:justify-between">
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
            <li className="relative flex col-span-2 rounded-md shadow-sm">
              <div className="w-full bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="mt-2 mb-5 sm:flex sm:items-start sm:justify-between">
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
                  <div className="mt-5 mb-5 sm:flex sm:items-start sm:justify-between">
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
                  <div className="mt-5 mb-5 sm:flex sm:items-start sm:justify-between">
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
                  <div className="mt-5 mb-5 sm:flex sm:items-start sm:justify-between">
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
          <ul className="grid grid-cols-1 gap-4 mt-8 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative flex col-span-2 rounded-md shadow-sm">
              <h2 className="mt-8 mb-4 text-lg font-medium leading-6 text-gray-900">
                DIKO Vault Rewards
              </h2>
            </li>
          </ul>
          <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <li className="relative flex col-span-2 rounded-md shadow-sm">
              <div className="w-full bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    
                  <div className="mt-5 mb-5 sm:flex sm:items-start sm:justify-between">
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
      </main> */}
    </Container>
  )
};
