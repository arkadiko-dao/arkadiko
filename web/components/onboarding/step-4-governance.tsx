
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
    if (currentStep !== 8) {
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
      stepPosition: "top-[310px] left-[270px]",
      blockPosition: "top-[60px] left-[-116px] w-[400px]",
      arrowPosition: "top-[238px] left-[258px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Proposal title",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[342px] left-[18px]",
      blockPosition: "top-[368px] left-[82px] w-[400px]",
      arrowPosition: "top-[360px] left-[16px] rotate-[-40deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Proposer's address",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[310px] left-[947px]",
      blockPosition: "top-[44px] left-[524px] w-[400px]",
      arrowPosition: "top-[223px] left-[907px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Proposal status",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[336px] left-[737px]",
      blockPosition: "top-[395px] left-[630px] w-[400px]",
      arrowPosition: "top-[330px] left-[684px] rotate-[52deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Closing Block Height",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    }
  ];

  const STEPS_LIST_B = [
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[237px] left-[93px]",
      blockPosition: "top-[-20px] left-[-116px] w-[400px]",
      arrowPosition: "top-[164px] left-[78px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "External link to discuss proposal",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[395px] left-[474px]",
      blockPosition: "top-[323px] left-[0px] w-[400px]",
      arrowPosition: "top-[338px] left-[420px] rotate-[140deg]",
      arrowSize: "w-16 h-16",
      stepTitle: "Vote with DIKO or stDIKO",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
    {
      stepWrapperPosition: "top-0 left-0",
      stepPosition: "top-[310px] left-[947px]",
      blockPosition: "top-[44px] left-[524px] w-[400px]",
      arrowPosition: "top-[223px] left-[907px] rotate-[180deg]",
      arrowSize: "w-20 h-20",
      stepTitle: "Voting results",
      stepDescription: "Step description - Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam sunt facilis aperiam.",
    },
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

        <div className="px-6 mx-auto lg:px-8 sm:pb-12">
          <main className="pt-12 pb-12 sm:pt-0">
            <h2 className="text-3xl font-headings">0{currentSection + 1} — Governance</h2>
            <div className="relative max-w-[1000px] mx-auto">
          
              {(currentStep >= 0) && (currentStep < 5) ? (
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

              {(currentStep >= 5) ? (
                <>
                  <img className="mt-8 border border-gray-100 rounded-md shadow" src="/assets/onboarding/governance-2.jpeg" alt="" />
                  {STEPS_LIST_B.map((stepProps, i) => (
                    <Step
                      key={i + 1}
                      currentStep={currentStep - 4}
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
