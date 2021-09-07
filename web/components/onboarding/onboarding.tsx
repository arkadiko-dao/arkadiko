import React, { useEffect, useState } from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import { classNames } from '@common/class-names';

export const Onboarding = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    localStorage.setItem('arkadiko-onboarding', 'true');

    setTimeout(() => {
      setShowButton(true);
    }, 3000);
  }, []);

  return (
    <div
      className="h-screen"
      style={{backgroundImage: 'url("/assets/arkadiko-flash-cropped.gif")', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover'}}
    >
      <div 
        className={classNames(
          showButton ? 'opacity-100 visible' : 'opacity-0 invisible',
          'absolute transform -translate-x-1/2 -translate-y-1/2 top-[85%] left-1/2 transition duration-[1600ms] ease-in-out'
          )
        }
      >
        <RouterLink 
          to="/onboarding/step-1-swap" 
          className="inline-flex items-center px-8 py-4 text-2xl font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Get started
        </RouterLink>

        <p className="mt-8 text-center">
          <RouterLink to="/" className="inline-flex items-center text-xs font-medium text-gray-200 hover:text-gray-50">Skip the onboarding</RouterLink>
        </p>
      </div>
    </div>
  );
};
