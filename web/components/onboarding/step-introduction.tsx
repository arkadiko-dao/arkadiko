import React from 'react';
import { classNames } from '@common/class-names';

interface StepIntroductionProps {
  currentStep: Number;
  stepNumber: Number;
  stepTitle: string;
  stepDescription: string;
}

export const StepIntroduction: React.FC<StepIntroductionProps> = ({
  currentStep,
  stepNumber,
  stepTitle,
  stepDescription,
}) => {
  return (
    <div
      className={classNames(
        currentStep >= stepNumber ? 'visible opacity-100' : 'invisible opacity-0',
        `absolute transform top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition duration-1000 ease-in-out step-0 z-10`
      )}
    >
      <div
        className={classNames(
          currentStep >= stepNumber ? 'visible opacity-100' : 'invisible opacity-0',
          `absolute transform top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 min-w-[24rem] rounded-md transition duration-1000 ease-in-out delay-700`
        )}
      >
        <div className="relative p-6 mx-auto">
          <h1 className="text-2xl text-white font-headings">{stepTitle}</h1>
          <p className="mt-3 text-base text-gray-300">{stepDescription}</p>
        </div>
      </div>
    </div>
  );
};
