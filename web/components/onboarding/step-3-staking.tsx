
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';
import { StepIntroduction } from './step-introduction';
import { classNames } from '@common/class-names';


export const OnboardingStep3Staking = () => {
  // const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const currentSection = 2;
    
  const goToNextStep = () => {
    setCurrentStep(previousStep => previousStep + 1)
  }
  
  const goToPreviousStep = () => {
    if (currentStep !== 0) {
      setCurrentStep(previousStep => previousStep - 1)
    }
  }

  const STEPS_LIST = [
    {
      stepWrapperPosition: "bottom-0 left-0",
      stepPosition: "top-0 left-0",
      blockPosition: "bottom-0 left-0 w-[400px]",
      arrowPosition: "top-0 left-0 rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Step title",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
  ];


  return (
    <>
      {(currentStep === 0) ? (  
        <StepIntroduction 
          currentStep={currentStep}
          stepNumber={0}
          stepTitle={"Staking"}
          stepDescription={"Staking introduction step - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam."}
        />
      ) : null }
    
      <div className="w-full min-h-screen bg-gray-100 overflow-hidden">
        <OnboardingNav 
          currentSection={currentSection} 
        />

        <div className="px-6 mx-auto lg:px-8">
          <main className="py-12">
            <h2 className="text-3xl font-headings">03 — Staking</h2>
            <div className="relative max-w-[1000px] mx-auto">
              {(currentStep >= 0 && currentStep < 2) ? (
                <>
                  <img 
                    className={
                      classNames((currentStep === 0) ? 
                        'filter blur transition duration-200 ease-in-out' : '', 
                        'mt-8 border border-gray-100 rounded-md shadow'
                      )}
                    src="/assets/onboarding/staking.jpeg" alt="" />
                  {STEPS_LIST.map((stepProps, i) => (
                    <Step
                      key={i + 1}
                      currentStep={currentStep}
                      stepNumber={i + 1}
                      {...stepProps}
                      stepTotal={STEPS_LIST.length}
                    />
                  ))}
                </>
              ) : null }
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
