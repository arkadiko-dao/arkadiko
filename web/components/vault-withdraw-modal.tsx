import React, { useContext, useState, useRef, useEffect } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext, CollateralTypeProps } from '@common/context';
import { InputAmount } from './input-amount';
import {
  AnchorMode,
  contractPrincipalCV,
  stringAsciiCV,
  cvToJSON,
  uintCV,
  callReadOnlyFunction,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { availableCollateralToWithdraw, resolveReserveName, tokenTraits } from '@common/vault-utils';
import { getPrice } from '@common/get-price';

interface Props {
  showWithdrawModal: boolean;
  setShowWithdrawModal: (arg: boolean) => void;
}

export const VaultWithdrawModal: React.FC<Props> = ({ match, showWithdrawModal, setShowWithdrawModal }) => {
  const setState = useContext(AppContext);
  const [vault, setVault] = useState<VaultProps>();
  const [price, setPrice] = useState(0);
  const [collateralType, setCollateralType] = useState<CollateralTypeProps>();
  const [collateralToWithdraw, setCollateralToWithdraw] = useState('');
  const [maximumCollateralToWithdraw, setMaximumCollateralToWithdraw] = useState(0);
  const [reserveName, setReserveName] = useState('');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const senderAddress = useSTXAddress();
  const { doContractCall } = useConnect();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchVault = async () => {
      const serializedVault = await callReadOnlyFunction({
        contractAddress,
        contractName: 'arkadiko-freddie-v1-1',
        functionName: 'get-vault-by-id',
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
          stackerName: data['stacker-name'].value,
          revokedStacking: data['revoked-stacking'].value,
          collateralData: {},
        });
        setReserveName(resolveReserveName(data['collateral-token'].value));
      
        const price = await getPrice(data['collateral-token'].value);
        setPrice(price);

        const type = await callReadOnlyFunction({
          contractAddress,
          contractName: 'arkadiko-collateral-types-v1-1',
          functionName: 'get-collateral-type-by-name',
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
          stabilityFeeApy: json.value['stability-fee-apy'].value,
        });
      }
    };
    fetchVault();
  }, [match.params.id]);

  useEffect(() => {
    if (vault && collateralType?.collateralToDebtRatio) {
      if (Number(vault.stackedTokens) === 0) {
        setMaximumCollateralToWithdraw(
          availableCollateralToWithdraw(
            price,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio
          )
        );
      } else {
        setMaximumCollateralToWithdraw(0);
      }
    }
  }, [collateralType?.collateralToDebtRatio, price]);

  const callWithdraw = async () => {
    if (parseFloat(collateralToWithdraw) > maximumCollateralToWithdraw) {
      return;
    }

    const token = tokenTraits[vault['collateralToken'].toLowerCase()]['name'];
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'withdraw',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(collateralToWithdraw) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', token),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        console.log('finished withdraw!', data);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowWithdrawModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  };
  
  const withdrawMaxAmount = () => {
    return setCollateralToWithdraw(String(maximumCollateralToWithdraw));
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setCollateralToWithdraw(value);
  };

  
  return (
    <Modal
      open={showWithdrawModal}
      title="Withdraw Collateral"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[1].logo} alt="" />}
      closeModal={() => setShowWithdrawModal(false)}
      buttonText="Withdraw"
      buttonAction={() => callWithdraw()}
      initialFocus={inputRef}
    >
      <p className="text-sm text-center text-gray-500">
        Choose how much collateral you want to withdraw. You can withdraw a maximum of{' '}
        {maximumCollateralToWithdraw} {vault?.collateralToken.toUpperCase()}.
      </p>
      <p className="text-sm text-center text-gray-500">
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
          onClickMax={withdrawMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
