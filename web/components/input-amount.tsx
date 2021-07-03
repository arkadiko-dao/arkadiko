import React from 'react';

interface InputAmountProps {
  balance: string;
  token: string;
  inputName: string;
  inputId: string;
  inputValue: string;
  inputLabel: string;
  onInputChange: (event: any) => void;
  onClickMax: (event: any) => void;
}

export const InputAmount: React.FC<InputAmountProps> = ({balance, token, inputName, inputId, inputValue, inputLabel, onInputChange, onClickMax}) => {
  return (
    <div className="flex flex-col relative">
      <span className="text-xs text-gray-600">Available amount {balance} {token}</span>
      <div className="min-w-0 h-10 inline-flex items-center border border-gray-300 rounded-md w-full mt-2 mb-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          pattern="^[0-9]*[.,]?[0-9]*$" 
          placeholder="0.0"
          name={inputName} 
          id={inputId}
          aria-label={inputLabel}
          className="sm:text-sm px-3 focus:outline-none focus:ring-0 border-0 rounded-md min-w-0 flex-1 mr-2"
          value={inputValue}
          onChange={onInputChange}
          />
        <div className="flex-shrink-0 mx-1 text-sm ml-auto">
          <div className="flex items-center min-w-0">
            <span className="sm:text-sm text-gray-400">{token}</span>
            <div className="w-px h-3 bg-gray-400 mx-2"></div>
            <button
              type="button"
              onClick={onClickMax}
              className="p-0 rounded-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-100 p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
            >
              Max.
            </button>
          </div>
        </div>
        <label className="sr-only">{inputLabel}</label>
      </div>
    </div>
  )
};
