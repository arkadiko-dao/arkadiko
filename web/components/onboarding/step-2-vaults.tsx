
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';
import { StepIntroduction } from './step-introduction';
import { classNames } from '@common/class-names';

export const OnboardingStep2Vaults = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const currentSection = 1;

  if (currentStep === 1) {
    setTimeout(() => {
      window.scrollTo({
        top: 500,
        behavior: 'smooth'
      })
    }, 800);
  }

  if (currentStep === 5) {
    setTimeout(() => {
      window.scrollTo({
        top: 500,
        behavior: 'smooth'
      })
    }, 200);
  }
    
  const goToNextStep = () => {
    if (currentStep !== 6) {
      setCurrentStep(previousStep => previousStep + 1)
    } else {
      history.push("/onboarding/step-3-staking")
    }
  }
  
  const goToPreviousStep = () => {
    if (currentStep !== 0) {
      setCurrentStep(previousStep => previousStep - 1)
    }
  }

  const STEPS_LIST_A = [
    {
      stepWrapperPosition: "bottom-0 left-0",
      stepPosition: "top-[-60px] left-[668px]",
      blockPosition: "bottom-[145px] left-[516px] w-[400px]",
      arrowPosition: "top-[-138px] left-[650px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose new vault with collateral type",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
  ];

  const STEPS_LIST_B = [
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[280px] left-[24px]",
      blockPosition: "top-[20px] left-[-200px] w-[346px]",
      arrowPosition: "top-[190px] left-[-8px] rotate-[168deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose STX collateral amount",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[395px] left-[24px]",
      blockPosition: "top-[426px] left-[90px] w-[450px]",
      arrowPosition: "top-[430px] left-[12px] rotate-[-12deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Choose USDA to borrow against collateral",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
    },
    {
      stepWrapperPosition: "bottom-0 right-0",
      stepPosition: "bottom-[325px] left-[-96px]",
      blockPosition: "bottom-[400px] right-0 w-[500px]",
      arrowPosition: "bottom-[312px] left-[-90px] rotate-[206deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Verify your collateralization ratio & liquidation price",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    }
  ];

  const STEPS_LIST_C = [
    {
      stepWrapperPosition: "bottom-0 left-0",
      stepPosition: "bottom-[105px] left-[118px]",
      blockPosition: "bottom-[164px] left-0 w-[346px]",
      arrowPosition: "bottom-[72px] left-[40px] rotate-[110deg] scale-x-[-1]",
      arrowSize: "w-20 h-20", 
      stepTitle: "Select stacking and Auto-payoff ",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "bottom-0 right-0",
      stepPosition: "bottom-[30px] left-[-254px]",
      blockPosition: "bottom-[100px] left-[-300px] w-[346px]",
      arrowPosition: "bottom-[24px] left-[-224px] rotate-[-116deg]",
      arrowSize: "w-20 h-20", 
      stepTitle: "Create Vault",
      stepDescription: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
  ];

  return (
    <>
      {(currentStep === 0) ? (  
        <StepIntroduction 
          currentStep={currentStep}
          stepNumber={0}
          stepTitle={"Vaults"}
          stepDescription={"Vaults introduction step - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam."}
        />
      ) : null }
      
      <div className="w-full min-h-screen overflow-hidden bg-gray-100">
        <OnboardingNav 
          currentSection={currentSection} 
        />

        <div className="px-6 mx-auto lg:px-8">
          <main className="py-12">
            <h2 className="text-3xl font-headings">02 — Vaults</h2>
            <div className="relative max-w-[1000px] mx-auto">
              {(currentStep >= 0 && currentStep < 2) ? (
                <>
                  <img 
                    className={
                      classNames((currentStep === 0) ? 
                        'filter blur transition duration-200 ease-in-out' : '', 
                        'mt-8 border border-gray-100 rounded-md shadow'
                      )}
                    src="/assets/onboarding/vaults-1.png" alt="" />
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

              {(currentStep >= 2 && currentStep < 5) ? (
                <>
                  <img className="mt-8 border border-gray-100 rounded-md shadow" src="/assets/onboarding/vaults-2.jpeg" alt="" />
                  {STEPS_LIST_B.map((stepProps, i) => (
                    <Step
                      key={i + 1}
                      currentStep={currentStep - 1}
                      stepNumber={i + 1}
                      {...stepProps}
                      stepTotal={STEPS_LIST_B.length}
                    />
                  ))}
                </>
              ) : null }

              {(currentStep >= 5) ? (
                <>
                  <img className="mt-8 border border-gray-100 rounded-md shadow" src="/assets/onboarding/vaults-3.png" alt="" />
                  {STEPS_LIST_C.map((stepProps, i) => (
                    <Step
                      key={i + 1}
                      currentStep={currentStep - 4}
                      stepNumber={i + 1}
                      {...stepProps}
                      stepTotal={STEPS_LIST_C.length}
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
