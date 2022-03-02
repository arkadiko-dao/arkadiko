import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Container } from './home';
import { CreateVaultStepOne } from './create-vault-step-one';
import { CreateVaultStepTwo } from './create-vault-step-two';
import { CreateVaultConfirm } from './create-vault-confirm';
import { CreateVaultTransact } from './create-vault-transact';

export const NewVault = () => {
  const [step, setStep] = useState(0);
  const [coinAmounts, setCoinAmounts] = useState({
    amounts: { stx: 0, usda: 0 },
    'collateral-to-debt-ratio': 0,
    'liquidation-price': 0,
    'stack-pox': true,
    'auto-payoff': true,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Create vault</title>
      </Helmet>

      <Container>
        <main className="py-12">
          {step === 0 ? (
            <CreateVaultStepOne setStep={setStep} setCoinAmounts={setCoinAmounts} />
            ) : step === 1 ? (
              <CreateVaultStepTwo setStep={setStep} setCoinAmounts={setCoinAmounts} />
            ) : step === 2 ? (
            <CreateVaultConfirm
              setStep={setStep}
              coinAmounts={coinAmounts}
              setCoinAmounts={setCoinAmounts}
            />
          ) : (
            <CreateVaultTransact coinAmounts={coinAmounts} />
          )}
        </main>
      </Container>
    </>
  );
};
