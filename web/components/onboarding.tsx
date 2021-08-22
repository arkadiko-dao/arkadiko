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
      style={{backgroundImage: 'url("/assets/arkadiko-flash-cropped.gif")', height: '100vh', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover'}}
    >
      {showButton ? (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={() => showOnboarding()}
            className="inline-flex self-center px-4 py-2 ml-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Get Started
          </button>
        </div>
      ) : null}
    </div>
  );
};
