
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';
import { StepIntroduction } from './step-introduction';
import { classNames } from '@common/class-names';


export const OnboardingStep4Governance = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const currentSection = 3;
    
  const goToNextStep = () => {
    if (currentStep !== 6) {
      setCurrentStep(previousStep => previousStep + 1)
    } else {
      history.push("/")
    }
  }
  
  const goToPreviousStep = () => {
    if (currentStep !== 0) {
      setCurrentStep(previousStep => previousStep - 1)
    }
  }

  const STEPS_LIST_A = [
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[248px] left-[332px]",
      blockPosition: "top-0 left-[-88px] w-[400px]",
      arrowPosition: "top-[164px] left-[297px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Governance 1",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[248px] left-[474px]",
      blockPosition: "top-[290px] left-[560px] w-[400px]",
      arrowPosition: "top-[275px] left-[470px] rotate-[-40deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Governance 2",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    }
  ];


  return (
    <>
      {(currentStep === 0) ? (  
        <StepIntroduction 
          currentStep={currentStep}
          stepNumber={0}
          stepTitle={"Governance"}
          stepDescription={"Governance introduction step - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam."}
        />
      ) : null }
    
      <div className="w-full min-h-screen overflow-hidden bg-gray-100">
        <OnboardingNav 
          currentSection={currentSection} 
        />

        <div className="px-6 mx-auto lg:px-8">
          <main className="py-12">
            <h2 className="text-3xl font-headings">0{currentSection + 1} — Governance</h2>
            <div className="relative max-w-[1000px] mx-auto">
          
              {(currentStep >= 0) && (currentStep < 3) ? (
                <>
                  <img 
                    className={
                      classNames((currentStep === 0) ? 
                        'filter blur transition duration-200 ease-in-out' : '', 
                        'mt-8 border border-gray-100 rounded-md shadow'
                      )}
                    src="/assets/onboarding/governance-1.jpeg" alt="" />
                  
                  {STEPS_LIST_A.map((stepProps, i) => (
                    <Step
                      key={i + 1}
                      currentStep={currentStep}
                      stepNumber={i + 1}
                      {...stepProps}
                      stepTotal={STEPS_LIST_A.length}
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
