import React, { useState } from 'react';
import { Box } from '@blockstack/ui';
import { Container } from './home';
import { CreateVaultStepOne } from './create-vault-step-one';
import { CreateVaultConfirm } from './create-vault-confirm';
import { CreateVaultTransact } from './create-vault-transact';

export const NewVault = () => {
  const [step, setStep] = useState(0);
  const [coinAmounts, setCoinAmounts] = useState({
    amounts: { stx: 0, xusd: 0 },
    'collateral-to-debt-ratio': 0,
    'liquidation-price': 0
  });

  return (
    <Container>
      <Box py={6}>
        <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
          <div className="mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {step === 0 ? (
                <CreateVaultStepOne setStep={setStep} setCoinAmounts={setCoinAmounts} />
              ) : step === 1 ? (
                <CreateVaultConfirm setStep={setStep} coinAmounts={coinAmounts} />
              ) : (
                <CreateVaultTransact coinAmounts={coinAmounts} />
              )}
            </div>
          </div>
        </main>
      </Box>
    </Container>
  );
};
