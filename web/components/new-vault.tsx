import React, { useState } from 'react';
import { Container } from './home';
import { CreateVaultStepOne } from './create-vault-step-one';
import { CreateVaultConfirm } from './create-vault-confirm';
import { CreateVaultTransact } from './create-vault-transact';

export const NewVault = () => {
  const [step, setStep] = useState(0);
  const [coinAmounts, setCoinAmounts] = useState({
    amounts: { stx: 0, usda: 0 },
    'collateral-to-debt-ratio': 0,
    'liquidation-price': 0,
    'stack-pox': true,
    'auto-payoff': true
  });

  return (
    <Container>
      <main className="py-12">
        {step === 0 ? (
          <CreateVaultStepOne setStep={setStep} setCoinAmounts={setCoinAmounts} />
        ) : step === 1 ? (
          <CreateVaultConfirm setStep={setStep} coinAmounts={coinAmounts} setCoinAmounts={setCoinAmounts} />
        ) : (
          <CreateVaultTransact coinAmounts={coinAmounts} />
        )}
      </main>
    </Container>
  );
};
