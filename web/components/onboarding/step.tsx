import React from 'react';
import { classNames } from '@common/class-names'; 

interface StepProps {
  currentStep: Number;
  stepWrapperPosition: string;
  stepPosition: string;
  blockPosition: string;
  arrowPosition: string;
  arrowSize: string;
  stepTitle: string;
  stepDescription: string;
  stepNumber: Number;
  stepTotal: Number;
}


export const Step: React.FC<StepProps> = ({ currentStep, stepWrapperPosition, stepPosition, blockPosition, arrowPosition, arrowSize, stepTitle, stepDescription, stepNumber, stepTotal }) => {
  
  return (
    <div className={classNames((currentStep >= stepNumber) ? 
      'visible opacity-100' :
      'invisible opacity-0', 
      `absolute transition duration-1000 ease-in-out ${stepWrapperPosition} step-${stepNumber}`)} 
      >
      <div className={`absolute ${stepPosition}`}>
        <span className="flex w-6 h-6">
          <span className="absolute inline-flex w-full h-full bg-gray-400 rounded-full opacity-75 animate-ping"></span>
          <span className="relative inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-gray-800 rounded-full">{stepNumber}</span>
        </span>
      </div>

      <div className={`absolute bg-gray-800 rounded-md ${blockPosition}`}>
        <div className="relative p-6 mx-auto">
          <div className="flex items-center">
            <span className="flex flex-shrink-0 w-6 h-6 mr-3">
              <span className="relative inline-flex items-center justify-center w-6 h-6 text-sm font-semibold text-gray-800 bg-white rounded-full">{stepNumber}</span>
            </span>
            <h2 className="text-lg text-white font-headings">
              {stepTitle}
            </h2>
          </div>
          <p className="mt-3 text-sm text-gray-300">
            {stepDescription}
          </p>

          <div className="flex items-center mt-4">
            <p className="text-xs text-gray-200">Step {stepNumber} of {stepTotal}</p>
          </div>
        </div>
      </div>

      <svg aria-hidden="true" className={`absolute transform w-20 h-20 ${arrowSize} ${arrowPosition}`} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 43.1 85.9">
        <path strokeLinecap="round" strokeLinejoin="round" fill="none" className={classNames((currentStep >= stepNumber) ? "draw-arrow" : "", "text-gray-800 stroke-current")} d="M11.3,2.5c-5.8,5-8.7,12.7-9,20.3s2,15.1,5.3,22c6.7,14,18,25.8,31.7,33.1" />
        <path strokeLinecap="round" strokeLinejoin="round" fill="none" className={classNames((currentStep >= stepNumber) ? "draw-arrow tail-1" : "", "text-gray-800 stroke-current")} d="M40.6,78.1C39,71.3,37.2,64.6,35.2,58" />
        <path strokeLinecap="round" strokeLinejoin="round" fill="none" className={classNames((currentStep >= stepNumber) ? "draw-arrow tail-2" : "", "text-gray-800 stroke-current")} d="M39.8,78.5c-7.2,1.7-14.3,3.3-21.5,4.9" />
      </svg>
    </div>
  );
};
