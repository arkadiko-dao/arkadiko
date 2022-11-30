import React, { useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { InputAmount } from './input-amount';
import { Alert } from './ui/alert';

export const StakeModal = ({
  type,
  showModal,
  setShowModal,
  tokenName,
  logoX,
  logoY,
  apr,
  max,
  callback
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxAmount = () => {
    setAmount(max);
  };

  const onInputChange = (event: any) => {
    const value = event.target.value;
    if (value > max) {
      if (errors.length < 1) {
        setErrors(errors.concat([`You cannot ${type.toLowerCase()} more than ${max} ${tokenName}`]));
      }
      setIsButtonDisabled(true);
    } else {
      setErrors([]);
      setIsButtonDisabled(false);
    }
    setAmount(value);
  };

  return (
    <Modal
      open={showModal}
      title={`${type} ${tokenName} Tokens`}
      icon={
        <div className="flex -space-x-2">
          <img
            className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
            src={logoX}
            alt=""
          />
          {logoX != logoY ? (
            <img
              className="inline-block w-8 h-8 rounded-full ring-2 ring-white"
              src={logoY}
              alt=""
            />
          ): null}
        </div>
      }
      closeModal={() => setShowModal(false)}
      buttonText={type}
      buttonAction={() => callback(amount)}
      buttonDisabled={isButtonDisabled || errors.length > 0}
      initialFocus={inputRef}
    >
      {errors.length > 0 ? (
        <div className="mb-4">
          <Alert type={Alert.type.ERROR}>
            <p>{errors[0]}</p>
          </Alert>
        </div>
      ) : null}

      {type == "Stake" && apr == "0" ? (
        <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
          Stake your {tokenName} tokens and start earning rewards now.
        </p>
      ): type == "Stake" && apr != "0" ? (
        <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
          Stake your {tokenName} tokens at {apr}% (estimated APR) and start earning rewards now.
        </p>
      ): type == "Unstake" && apr == "0" ? (
        <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
          Unstake your {tokenName} tokens and start earning rewards now.
        </p>
      ):(
        <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
          Unstake your {tokenName} tokens at {apr}% (estimated APR) and start earning rewards now.
        </p>
      )}

      <div className="mt-6">
        <InputAmount
          balance={max.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token={tokenName}
          inputName={`name-${tokenName}`}
          inputId={`id-${tokenName}`}
          inputValue={amount}
          inputLabel={`${type} ${tokenName}`}
          onInputChange={onInputChange}
          onClickMax={maxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
