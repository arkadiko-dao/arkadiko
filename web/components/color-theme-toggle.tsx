import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/solid';
import useDarkMode from './use-dark-mode';

export const ColorThemeToggle = () => {
  const [colorTheme, setTheme] = useDarkMode();
  return (
    <button
      type="button"
      onClick={() => setTheme(colorTheme)}
      >
        {colorTheme === 'light' ? (
          <SunIcon
            className="w-5 h-5 mr-2 text-gray-50 group-hover:text-gray-900"
            aria-hidden="true"
          />
        ) : (
          <MoonIcon
            className="w-5 h-5 mr-2 text-gray-500 group-hover:text-gray-900"
            aria-hidden="true"
          />
        )
      }
    </button>
  );
};
