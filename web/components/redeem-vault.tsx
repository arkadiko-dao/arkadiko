import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import {
  Cl
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { request } from '@stacks/connect';
import { Alert } from './ui/alert';

interface Props {
  showRedeemModal: boolean;
  setShowRedeemModal: (arg: boolean) => void;
}

export const RedeemVault: React.FC<Props> = ({ showRedeemModal, setShowRedeemModal, collateralToRedeem, prices, stxVault, stStxVault, xBtcVault }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isRedeemButtonDisabled, setIsRedeemButtonDisabled] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const inputRef = useRef<HTMLInputElement>(null);

  const redeemMaxAmount = () => {
    setRedeemAmount((state.balance['usda'] / 1000000).toString());
  };

  const onInputRedeemChange = (event: any) => {
    const value = event.target.value;
    // trying to redeem
    if (value > state.balance['usda'] / 1000000) {
      if (errors.length < 1) {
        setErrors(
          errors.concat([`You cannot redeem more than ${state.balance['usda'] / 1000000} USDA`])
        );
      }
      setIsRedeemButtonDisabled(true);
    } else {
      setErrors([]);
      setIsRedeemButtonDisabled(false);
    }
    setRedeemAmount(value);
  };

  const redeemVaultTransact = async () => {
    const amount = Cl.uint(Number((parseFloat(redeemAmount) * 1000000).toFixed(0)));
    const postConditions = [
      {
        type: "ft-postcondition",
        address: stxAddress!,
        condition: "eq",
        amount: amount.value,
        asset: `${contractAddress}.usda-token::usda`,
      },
    ];

    const vault = collateralToRedeem === 'stSTX' ? stStxVault : collateralToRedeem === 'xBTC' ? xBtcVault : stxVault;
    const remainingDebt = Math.max((vault['debt'] + vault['stability-fee']) - redeemAmount, 0);

    const BASE_URL = process.env.HINT_API_URL;
    const collateralLeft = vault['collateral'] - (redeemAmount / prices[collateralToRedeem]);
    const url = BASE_URL + `?owner=${vault['owner']}&token=${vault['token']}&collateral=${collateralLeft}&debt=${remainingDebt}`;
    const response = await fetch(url);
    const hint = await response.json();
    console.log('got hint:', hint);

    await request('stx_callContract', {
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-vaults-manager-v1-2',
      functionName: 'redeem-vault',
      functionArgs: [
        Cl.contractPrincipal(contractAddress, 'arkadiko-vaults-tokens-v1-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-vaults-data-v1-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-vaults-sorted-v1-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-vaults-pool-active-v1-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-vaults-helpers-v1-1'),
        Cl.contractPrincipal(contractAddress, 'arkadiko-oracle-v2-3'),
        Cl.standardPrincipal(vault['owner']),
        Cl.contractPrincipal(vault['token'].split('.')[0], vault['token'].split('.')[1]),
        amount,
        Cl.some(Cl.standardPrincipal(hint['prevOwner'])),
      ],
      postConditions,
      onFinish: data => {
        console.log('finished broadcasting staking tx!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowRedeemModal(false);
      }
    }, resolveProvider() || window.StacksProvider);
  };

  return (
    <Modal
      open={showRedeemModal}
      title="Redeem Vault"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />}
      closeModal={() => setShowRedeemModal(false)}
      buttonText="Redeem"
      buttonAction={() => redeemVaultTransact()}
      buttonDisabled={isRedeemButtonDisabled || errors.length > 0}
      initialFocus={inputRef}
    >
      {errors.length > 0 ? (
        <div className="mb-4">
          <Alert type={Alert.type.ERROR}>
            <p>{errors[0]}</p>
          </Alert>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
        Redeem the {collateralToRedeem} vault for up to {stStxVault['debt']} USDA.
      </p>
      <div className="mt-6">
        <InputAmount
          balance={microToReadable(state.balance['usda']).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="USDA"
          inputName="redeemVault"
          inputId="redeemAmount"
          inputValue={redeemAmount}
          inputLabel="Redeem USDA"
          onInputChange={onInputRedeemChange}
          onClickMax={redeemMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
