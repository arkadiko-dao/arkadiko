import React from 'react';

export const OnboardingNavFooter = ({ currentStep, goToPreviousStep, goToNextStep }) => {
  return (
    <div className="fixed inset-x-0 bottom-0">
      <div>
        <div className="px-3 py-3 mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between">
            <div className="shrink-0 mt-2 sm:order-2 sm:mt-0 sm:w-auto">
              {currentStep >= 1 ? (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-2 00"
                  onClick={() => goToPreviousStep()}
                >
                  Previous
                </button>
              ) : null}
            </div>
            <div className="shrink-0 order-3 mt-2 sm:order-2 sm:mt-0 sm:w-auto">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-2 00"
                onClick={() => goToNextStep()}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
