
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';
import { OnboardingNavFooter } from './onboarding-nav-footer';
import { Step } from './step';
import { StepIntroduction } from './step-introduction';
import { classNames } from '@common/class-names';


export const OnboardingStep3Staking = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const currentSection = 2;
    
  const goToNextStep = () => {
    if (currentStep !== 4) {
      setCurrentStep(previousStep => previousStep + 1)
    } else {
      history.push("/onboarding/step-4-governance")
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
      stepTitle: "Cooldown",
      stepDescription: "A cooldown of 10 days applies when you are withdrawing your DIKO from the single-asset DIKO staking pool. This cooldown does not apply for LP token staking.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[248px] left-[474px]",
      blockPosition: "top-[290px] left-[560px] w-[400px]",
      arrowPosition: "top-[275px] left-[470px] rotate-[-40deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Current APR",
      stepDescription: "The current APR indicates your returns on the amount you are currently staking.",
    }
  ];

  const STEPS_LIST_B = [
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[248px] left-[628px]",
      blockPosition: "top-0 left-[196px] w-[400px]",
      arrowPosition: "top-[164px] left-[590px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Pending rewards",
      stepDescription: "The amount of tokens that will be sent to your wallet once you claim them or you withdraw from staking. The single-asset DIKO staking pool automatically compounds your rewards. The LP token pools require manual claims & compounding. ",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[290px] left-[916px]",
      blockPosition: "top-[344px] left-[448px] w-[400px]",
      arrowPosition: "top-[307px] left-[857px] rotate-[40deg] scale-x-[-1]",
      arrowSize: "w-20 h-20",
      stepTitle: "Actions dropdown",
      stepDescription: "Staking, unstaking and claiming rewards happens here!",
    }
  ];


  return (
    <>
      {(currentStep === 0) ? (  
        <StepIntroduction 
          currentStep={currentStep}
          stepNumber={0}
          stepTitle={"Staking"}
          stepDescription={"Staking is the perfect way to earn extra DIKO and participate in liquidity mining!"}
        />
      ) : null }
    
      <div className="w-full min-h-screen overflow-hidden bg-gray-100">
        <OnboardingNav 
          currentSection={currentSection} 
        />

        <div className="px-6 mx-auto lg:px-8 sm:pb-12">
          <main className="pt-12 pb-12 sm:pt-0">
            <h2 className="text-3xl font-headings">0{currentSection + 1} — Staking</h2>
            <div className="relative max-w-[1000px] mx-auto">
          
              {(currentStep >= 0) && (currentStep < 3) ? (
                <>
                  <img 
                    className={
                      classNames((currentStep === 0) ? 
                        'filter blur transition duration-200 ease-in-out' : '', 
                        'mt-8 border border-gray-100 rounded-md shadow'
                      )}
                    src="/assets/onboarding/staking-1.jpeg" alt="" />
                  
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

              {(currentStep >= 3) ? (
                <>
                  <img className="mt-8 border border-gray-100 rounded-md shadow" src="/assets/onboarding/staking-1.jpeg" alt="" />
                  {STEPS_LIST_B.map((stepProps, i) => (
                    <Step
                      key={i + 1}
                      currentStep={currentStep - 2}
                      stepNumber={i + 1}
                      {...stepProps}
                      stepTotal={STEPS_LIST_B.length}
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
