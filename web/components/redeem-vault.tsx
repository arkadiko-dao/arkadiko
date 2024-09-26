import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  createAssetInfo,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { Alert } from './ui/alert';

interface Props {
  showRedeemModal: boolean;
  setShowRedeemModal: (arg: boolean) => void;
}

export const RedeemVault: React.FC<Props> = ({ showRedeemModal, setShowRedeemModal, collateralToRedeem, stxVault, stStxVault, xBtcVault }) => {
  const [state, setState] = useContext(AppContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isRedeemButtonDisabled, setIsRedeemButtonDisabled] = useState(false);
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const stakeMaxAmount = () => {
    setRedeemAmount((state.balance['usda'] / 1000000).toString());
  };

  const onInputStakeChange = (event: any) => {
    const value = event.target.value;
    // trying to stake
    if (value > state.balance['usda'] / 1000000) {
      if (errors.length < 1) {
        setErrors(
          errors.concat([`You cannot stake more than ${state.balance['usda'] / 1000000} USDA`])
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
    const amount = uintCV(Number((parseFloat(redeemAmount) * 1000000).toFixed(0)));
    const postConditions = [
      makeStandardFungiblePostCondition(
        stxAddress || '',
        FungibleConditionCode.Equal,
        amount.value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'arkadiko-stake-registry-v2-1',
      functionName: 'stake',
      functionArgs: [
        contractPrincipalCV(contractAddress, 'arkadiko-stake-registry-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-stake-pool-diko-v2-1'),
        contractPrincipalCV(contractAddress, 'arkadiko-token'),
        amount,
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
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  return (
    <Modal
      open={showRedeemModal}
      title="Redeem Vault"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[3].logo} alt="" />}
      closeModal={() => setShowRedeemModal(false)}
      buttonText="Stake"
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
          balance={microToReadable(state.balance['diko']).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="DIKO"
          inputName="stakeDiko"
          inputId="redeemAmount"
          inputValue={redeemAmount}
          inputLabel="Stake DIKO"
          onInputChange={onInputStakeChange}
          onClickMax={stakeMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
