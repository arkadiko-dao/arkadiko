
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';
import { StepIntroduction } from './step-introduction';

export const OnboardingStep1Swap = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const currentSection = 0;

  const goToNextStep = () => {
    if (currentStep !== 4) {
      setCurrentStep(previousStep => previousStep + 1)
    } else {
      history.push("/onboarding/step-2-vaults")
    }
  }
  
  const goToPreviousStep = () => {
    if (currentStep !== 0) {
      setCurrentStep(previousStep => previousStep - 1)
    }
  }

  const STEPS_LIST = [
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[112px] left-[20px]",
      blockPosition: "top-[60px] left-[-455px] w-[400px]",
      arrowPosition: "top-[48px] left-[-48px] rotate-[123deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose tokens",
      stepDescription: "Select the token pair you would like to trade on. We support DIKO/USDA, DIKO/STX and STX/USDA with more pairs to come soon!",
    },
    {
      stepWrapperPosition: "top-0 right-0",
      stepPosition: "top-[140px] left-[-96px]",
      blockPosition: "top-[198px] left-[-8px] w-[400px]",
      arrowPosition: "top-[160px] left-[-96px] rotate-[-40deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose token X amount",
      stepDescription: "Type the amount of tokens you would like to swap. The approximate amount of tokens you will receive will be filled in automatically based on the current market price.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[40px] left-[462px]",
      blockPosition: "top-[-45px] left-[560px] w-[400px]",
      arrowPosition: "top-[40px] left-[481px] rotate-[-75deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Choose slippage, if necessary",
      stepDescription: "If you want to be absolutely sure your transaction will confirm, you can adjust the slippage. This allows you to pay a higher fee for more certainty, but you might receive a little less tokens.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[362px] left-[8px]",
      blockPosition: "top-[272px] left-[-445px] w-[400px]",
      arrowPosition: "top-[292px] left-[-40px] rotate-[145deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Swap",
      stepDescription: "Once ready, click the 'Swap' button. You will receive your tokens once the transaction confirms (typically around 10-15 minutes).",
    }
  ]


  return (
    <>
      {(currentStep === 0) ? (  
        <StepIntroduction 
          currentStep={currentStep}
          stepNumber={0}
          stepTitle={"Swap"}
          stepDescription={"A permissionless and decentralised way to swap your favorite tokens on the Arkadiko Decentralized Exchange, all on top of the Stacks blockchain."}
        />
      ) : null }

      <div className="w-full min-h-screen overflow-hidden bg-gray-100">
        <OnboardingNav currentSection={currentSection} />
        <div className="px-6 mx-auto lg:px-8 sm:pb-12">
          <main className="pt-12 pb-12 sm:pt-0">
            <h2 className="text-3xl font-headings">0{currentSection + 1} — Swap</h2>
            <div className="relative max-w-[554px] mx-auto">
              <img className={(currentStep === 0) ? 'filter blur transition duration-200 ease-in-out' : ''} src="/assets/onboarding/swap.png" alt="" />

              {STEPS_LIST.map((stepProps, i) => (
                <Step
                  key={i + 1}
                  currentStep={currentStep}
                  stepNumber={i + 1}
                  {...stepProps}
                  stepTotal={STEPS_LIST.length}
                />
              ))}
            </div>
          </main>
        </div>
        <OnboardingNavFooter
          currentStep={currentStep}
          goToPreviousStep={goToPreviousStep}
          goToNextStep={goToNextStep} 
        />
      </div>
    </>
  );
};
