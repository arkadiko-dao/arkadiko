import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Container } from './home';
import { CreateVaultStepOne } from './create-vault-step-one';
import { CreateVaultStepTwo } from './create-vault-step-two';
import { CreateVaultConfirm } from './create-vault-confirm';
import { CreateVaultTransact } from './create-vault-transact';
import { useLocation } from 'react-router-dom';

export const NewVault = () => {
  const search = useLocation().search;
  const type = new URLSearchParams(search).get('type');
  const token = new URLSearchParams(search).get('token');

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
    if (type && token) {
      setStep(1);
    }
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
