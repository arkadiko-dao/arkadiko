
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';

export const OnboardingStep1Swap = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(1);
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
  
  const STEPS_LIST =  [
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[112px] left-[20px]",
      blockPosition: "top-[60px] left-[-340px] max-w-[285px]",
      arrowPosition: "top-[48px] left-[-48px] rotate-[123deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose tokens",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 right-0",
      stepPosition: "top-[140px] left-[-96px]",
      blockPosition: "right-[-320px] top-[196px] max-w-[320px]",
      arrowPosition: "top-[160px] left-[-96px] rotate-[-40deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose token X amount",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 right-0",
      stepPosition: "top-[40px] left-[-96px]",
      blockPosition: "right-[-320px] top-[-40px] max-w-[320px]",
      arrowPosition: "top-[45px] left-[-90px] rotate-[-75deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Choose slippage, if necessary",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[362px] left-[8px]",
      blockPosition: "top-[272px] left-[-340px] max-w-[285px]",
      arrowPosition: "top-[292px] left-[-40px] rotate-[145deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Swap",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    }
  ]


  return (
    <div className="w-full min-h-screen bg-gray-100">
      <OnboardingNav currentSection={currentSection} />

      <div className="px-6 mx-auto lg:px-8">
        <main className="py-12">
          <h2 className="text-3xl font-headings">01 — Swap</h2>
          <div className="relative max-w-[554px] mx-auto">
            <img src="/assets/onboarding/swap.png" alt="" />

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
  );
};
