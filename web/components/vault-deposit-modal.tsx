import React, { useContext, useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext } from '@common/context';
import { InputAmount } from './input-amount';
import { Alert } from './ui/alert';
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  createAssetInfo
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network, resolveProvider } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import BN from 'bn.js';
import { VaultProps } from './vault';
import { tokenTraits } from '@common/vault-utils';

interface Props {
  showDepositModal: boolean;
  setShowDepositModal: (arg: boolean) => void;
  vault: VaultProps;
  reserveName: string;
  decimals: number;
}

export const VaultDepositModal: React.FC<Props> = ({
  match,
  showDepositModal,
  setShowDepositModal,
  vault,
  reserveName,
  decimals,
}) => {
  const [state, setState] = useContext(AppContext);
  const [extraCollateralDeposit, setExtraCollateralDeposit] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const xbtcContractAddress = process.env.XBTC_CONTRACT_ADDRESS || '';
  const atAlexContractAddress = process.env.ATALEX_CONTRACT_ADDRESS || '';

  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  const addDeposit = async () => {
    if (!extraCollateralDeposit) {
      return;
    }
    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    const decimals = token === 'Wrapped-Bitcoin' || token === 'auto-alex' ? 100000000 : 1000000;
    const tokenAddress = tokenTraits[vault['collateralToken'].toLowerCase()]['address'];

    let postConditions: any[] = [];
    if (vault['collateralToken'].toLowerCase() === 'stx') {
      postConditions = [
        makeStandardSTXPostCondition(
          senderAddress || '',
          FungibleConditionCode.Equal,
          new BN(parseFloat(extraCollateralDeposit) * decimals)
        ),
      ];
    } else if (vault['collateralToken'].toLowerCase() === 'xbtc') {
      postConditions = [
        makeStandardFungiblePostCondition(
          senderAddress || '',
          FungibleConditionCode.LessEqual,
          new BN(parseFloat(extraCollateralDeposit) * decimals),
          createAssetInfo(
            xbtcContractAddress,
            'Wrapped-Bitcoin',
            'wrapped-bitcoin'
          )
        ),
      ];
    } else {
      postConditions = [
        makeStandardFungiblePostCondition(
          senderAddress || '',
          FungibleConditionCode.LessEqual,
          new BN(parseFloat(extraCollateralDeposit) * decimals),
          createAssetInfo(
            atAlexContractAddress,
            'auto-alex',
            'auto-alex'
          )
        ),
      ];
    }

    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'deposit',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(extraCollateralDeposit) * decimals),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(tokenAddress, token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v3-1'
        ),
      ],
      postConditions,
      onFinish: data => {
        console.log('finished deposit!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowDepositModal(false);
      },
      anchorMode: AnchorMode.Any,
    }, resolveProvider() || window.StacksProvider);
  };

  const depositMaxAmount = () => {
    const token = vault['collateralToken'].toLowerCase();
    const decimals = token === 'xbtc' || token === 'auto-alex' ? 100000000 : 1000000;
    if (token === 'stx') {
      setExtraCollateralDeposit((state.balance['stx'] / decimals - 1).toString());
    } else {
      setExtraCollateralDeposit((state.balance[token] / decimals).toString());
    }
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setExtraCollateralDeposit(value);
  };

  return (
    <Modal
      open={showDepositModal}
      title="Deposit Extra Collateral"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[2].logo} alt="" />}
      closeModal={() => setShowDepositModal(false)}
      buttonText="Add deposit"
      buttonAction={() => addDeposit()}
      initialFocus={inputRef}
    >
      <p className="text-sm text-center text-gray-500 dark:text-zinc-400">
        Choose how much extra collateral you want to post. You have a balance of{' '}
        <span className="font-semibold">
          {state.balance[vault?.collateralToken.toLowerCase()] / decimals}{' '}
          {vault?.collateralToken.toUpperCase()}
        </span>
        .
      </p>

      {vault && vault['collateralToken'] && vault['collateralToken'].toLowerCase() === 'stx' ? (
        <div className="my-4">
          <Alert>
            <p>
              When depositing in a vault that is already stacking, keep in mind that your extra
              collateral will be <span className="font-semibold">locked but not stacked</span>. You
              won't be able to stack these STX until the cooldown cycle!
            </p>
          </Alert>
        </div>
      ) : null}

      <div className="mt-6">
        <InputAmount
          balance={(state.balance[vault?.collateralToken.toLowerCase()] / decimals).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            }
          )}
          token={vault?.collateralToken.toUpperCase()}
          inputName="depositCollateral"
          inputId="depositExtraStxAmount"
          inputValue={extraCollateralDeposit}
          inputLabel="Deposit Extra Collateral"
          onInputChange={onInputChange}
          onClickMax={depositMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
