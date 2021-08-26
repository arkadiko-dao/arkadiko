
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';

export const OnboardingStep2Vaults = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);

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
      stepWrapperPosition: "bottom-0 left-0",
      stepPosition: "top-[-72px] left-[962px]",
      blockPosition: "bottom-[145px] left-[516px] w-[400px]",
      arrowPosition: "top-[-154px] left-[920px] rotate-[158deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose new vault with collateral type",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
  ];
  
  return (
    <div className="w-full min-h-screen bg-gray-100">
      <OnboardingNav 
        currentNavSection={2} 
      />

      <div className="px-6 mx-auto lg:px-8">
        <main className="py-12">
          <h2 className="text-3xl font-headings">02 — Vaults</h2>
          <div className="relative max-w-[1000px] mx-auto">
            <img src="/assets/onboarding/vaults-1.jpeg" alt="" />
            <img src="/assets/onboarding/vaults-2.jpeg" alt="" />

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
