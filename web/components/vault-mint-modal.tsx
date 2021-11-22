import React, { useContext, useState, useRef, useEffect } from 'react';
import { Modal } from '@components/ui/modal';
import { tokenList } from '@components/token-swap-list';
import { AppContext, CollateralTypeProps } from '@common/context';
import { InputAmount } from './input-amount';
import {
  AnchorMode,
  contractPrincipalCV,
  cvToJSON,
  stringAsciiCV,
  uintCV,
  callReadOnlyFunction,
} from '@stacks/transactions';
import { useSTXAddress } from '@common/use-stx-address';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { VaultProps } from './vault';
import { resolveReserveName, availableCoinsToMint } from '@common/vault-utils';
import { getPrice } from '@common/get-price';

interface Props {
  showMintModal: boolean;
  setShowMintModal: (arg: boolean) => void;
}

export const VaultMintModal: React.FC<Props> = ({ match, showMintModal, setShowMintModal }) => {
  const [state, setState] = useContext(AppContext);
  const [price, setPrice] = useState(0);
  const [vault, setVault] = useState<VaultProps>();
  const [usdToMint, setUsdToMint] = useState('');
  const [reserveName, setReserveName] = useState('');
  const [collateralType, setCollateralType] = useState<CollateralTypeProps>();

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
  
  const callMint = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress: senderAddress,
      contractName: 'arkadiko-freddie-v1-1',
      functionName: 'mint',
      functionArgs: [
        uintCV(match.params.id),
        uintCV(parseFloat(usdToMint) * 1000000),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', reserveName),
        contractPrincipalCV(
          process.env.REACT_APP_CONTRACT_ADDRESS || '',
          'arkadiko-collateral-types-v1-1'
        ),
        contractPrincipalCV(process.env.REACT_APP_CONTRACT_ADDRESS || '', 'arkadiko-oracle-v1-1'),
      ],
      onFinish: data => {
        console.log('finished mint!', data, data.txId);
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
        setShowMintModal(false);
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const collateralLocked = () => {
    if (vault) {
      const decimals = vault['collateralType'].toLowerCase().includes('stx') ? 1000000 : 100000000;
      return vault['collateral'] / decimals;
    }

    return 0;
  };

  const outstandingDebt = () => {
    if (vault) {
      return vault.debt / 1000000;
    }

    return 0;
  };

  const mintMaxAmount = () => {
    setUsdToMint(
      availableCoinsToMint(
        price,
        collateralLocked(),
        outstandingDebt(),
        collateralType?.collateralToDebtRatio,
        vault?.collateralToken
      ) * 0.98
    );
  };

  const onInputChange = (event: { target: { value: any; name: any } }) => {
    const value = event.target.value;
    setUsdToMint(value);
  };

  
  return (
    <Modal
      open={showMintModal}
      title="Mint extra USDA"
      icon={<img className="w-10 h-10 rounded-full" src={tokenList[0].logo} alt="" />}
      closeModal={() => setShowMintModal(false)}
      buttonText="Mint"
      buttonAction={() => callMint()}
      initialFocus={inputRef}
    >
      <p className="text-sm text-center text-gray-500">
        Choose how much extra USDA you want to mint. You can mint a maximum of{' '}
        {availableCoinsToMint(
          price,
          collateralLocked(),
          outstandingDebt(),
          collateralType?.collateralToDebtRatio,
          vault?.collateralToken
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        USDA.
      </p>
      
      <div className="mt-6">
        <InputAmount
          balance={availableCoinsToMint(
            price,
            collateralLocked(),
            outstandingDebt(),
            collateralType?.collateralToDebtRatio,
            vault?.collateralToken
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token="USDA"
          inputName="mintDebt"
          inputId="mintUSDAAmount"
          inputValue={usdToMint}
          inputLabel="Mint USDA"
          onInputChange={onInputChange}
          onClickMax={mintMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
