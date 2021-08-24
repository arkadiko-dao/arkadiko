import React, { useEffect, useState } from 'react';

export const Onboarding = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    console.log('blaat');
    setTimeout(() => {
      console.log('show button');
      setShowButton(true);
    }, 3500);
  }, []);

  const showOnboarding = () => {

  };

  return (
    <div
      className="h-screen"
      style={{backgroundImage: 'url("/assets/arkadiko-flash-cropped.gif")', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover'}}
    >
      {showButton ? (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 top-[80%] left-1/2">
          <button
            onClick={() => showOnboarding()}
            className="inline-flex items-center px-8 py-4 text-2xl font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Get Started
          </button>
        </div>
      ) : null}
    </div>
  );
};
