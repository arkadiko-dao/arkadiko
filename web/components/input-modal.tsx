import React, { useState, useRef } from 'react';
import { Modal } from '@components/ui/modal';
import { InputAmount } from './input-amount';
import { Alert } from './ui/alert';

export const InputModal = ({
  showModal,
  setShowModal,
  logoX,
  logoY,
  tokenName,
  title,
  subtitle,
  buttonText,
  maxAmount,
  callback
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setMaxAmount = () => {
    setAmount(maxAmount);
  };

  const onInputChange = (event: any) => {
    const value = event.target.value;
    if (value > maxAmount) {
      if (errors.length < 1) {
        setErrors(errors.concat([`Your input exceeds the maximum amount (${maxAmount})`]));
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
      title={title}
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
      buttonText={buttonText}
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

      <p className="mt-3 text-sm text-center text-gray-500 dark:text-zinc-400">
        {subtitle}
      </p>

      <div className="mt-6">
        <InputAmount
          balance={maxAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
          token={tokenName}
          inputName={`name-${tokenName}`}
          inputId={`id-${tokenName}`}
          inputValue={amount}
          inputLabel={`${tokenName}`}
          onInputChange={onInputChange}
          onClickMax={setMaxAmount}
          ref={inputRef}
        />
      </div>
    </Modal>
  );
};
