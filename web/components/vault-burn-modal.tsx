import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  createAssetInfo,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  showBurnModal: boolean;
  setShowBurnModal: (arg: boolean) => void;
  outstandingDebt: () => void;
  stabilityFee: number;
  vault: VaultProps;
  reserveName: string;
}

export const VaultBurnModal: React.FC<Props> = ({
  match,
  showBurnModal,
  setShowBurnModal,
  outstandingDebt,
  stabilityFee,
  vault,
  reserveName
}) => {
  const [state, setState] = useContext(AppContext);
  const [usdToBurn, setUsdToBurn] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const callBurn = async () => {
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    const tokenAddress = tokenTraits[vault['collateralToken'].toLowerCase()]['address'];
    let totalToBurn = Number(usdToBurn) + stabilityFee / 1000000;
    if (Number(totalToBurn) >= Number(state.balance['usda'] / 1000000)) {
      totalToBurn = Number(state.balance['usda'] / 1000000);
    }
    const postConditions = [
      makeStandardFungiblePostCondition(
        senderAddress || '',
        FungibleConditionCode.LessEqual,
        uintCV(parseInt(totalToBurn * 1000000, 10)).value,
        createAssetInfo(contractAddress, 'usda-token', 'usda')
      ),
    ];

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'burn',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseInt((parseFloat(usdToBurn) * 1000000) - (1.5 * stabilityFee), 10)),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(tokenAddress, token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
        ),
      ],
      postConditions,
      onFinish: data => {
        console.log('finished burn!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowBurnModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const burnMaxAmount = () => {
    let debtToPay = Number(outstandingDebt()) * 1000000 + Number(stabilityFee);
    if (debtToPay > state.balance['usda']) {
      const balance = Number(state.balance['usda']) / 1000000;
      debtToPay = balance.toFixed(6);
    }
    setUsdToBurn(debtToPay);
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setUsdToBurn(value);
  };

  return (
    <Modal
      open={showBurnModal}
      title="Burn USDA"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />}
      closeModal={() => setShowBurnModal(false)}
      buttonText="Burn"
      buttonAction={() => callBurn()}
      initialFocus={inputRef}
    >
      <p className="text-sm text-center text-gray-500 dark:text-zinc-400">
        Choose how much USDA you want to burn. Burning will include a stability fee of{' '}
        <span className="font-semibold">{stabilityFee / 1000000} USDA</span>.
      </p>

      <div className="mt-6">
        <InputAmount
          balance={(state.balance['usda'] / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="USDA"
          inputName="burnDebt"
          inputId="burnAmount"
          inputValue={usdToBurn}
          inputLabel="Burn USDA"
          onInputChange={onInputChange}
          onClickMax={burnMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
