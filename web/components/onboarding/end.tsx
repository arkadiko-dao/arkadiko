import React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import { OnboardingNav } from './onboarding-nav';

export const OnboardingEnd = () => {
  const currentSection = 4;

  return (
    <>
      <div className="w-full min-h-screen overflow-hidden bg-gray-100">
        <OnboardingNav currentSection={currentSection} />

        <div className="max-w-lg mx-auto mt-8">
          <main>
            <h1 className="mb-8 text-4xl font-bold text-center font-headings">
              That's it! You're all set! 🚀
            </h1>
            <div className="text-center">
              <p>
                Congratulations! You reached the end. Start using the app now and enjoy those
                self-repaying loans!
              </p>

              <RouterLink
                to="/"
                className="inline-flex items-center px-8 py-4 mt-8 text-2xl font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Open the app
              </RouterLink>

              <p className="mt-12">
                Got more questions? Feel free to join the community, connect with thousands of
                people and ask away!
              </p>

              <div className="mt-8 bg-white rounded-lg shadow-lg sm:grid sm:grid-cols-2">
                <a
                  href="https://discord.gg/7UB6JjjCNV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col p-6 text-center border-b border-gray-100 rounded-t-lg hover:bg-indigo-50 sm:rounded-r-none sm:rounded-l-lg sm:border-0 sm:border-r"
                >
                  <p className="order-2 mt-4 text-sm leading-6 text-indigo-500">Discord</p>
                  <div className="order-1 text-5xl font-extrabold text-indigo-600">
                    <svg
                      className="w-12 h-12 mx-auto"
                      viewBox="0 0 81 63"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0)">
                        <path
                          d="M68.57 5.61A66.6 66.6 0 0052.08.48a.25.25 0 00-.26.12 46.8 46.8 0 00-2.06 4.24 61.42 61.42 0 00-18.51 0A42.92 42.92 0 0029.16.6a.26.26 0 00-.26-.12A66.41 66.41 0 0012.4 5.6a.24.24 0 00-.1.1C1.8 21.45-1.09 36.81.32 51.98c.01.08.05.15.11.2a67.07 67.07 0 0020.23 10.26c.1.03.21 0 .28-.1a48.24 48.24 0 004.14-6.75c.07-.14 0-.3-.14-.36-2.2-.84-4.3-1.86-6.32-3.02a.26.26 0 01-.03-.44c.43-.32.85-.65 1.26-.98a.25.25 0 01.26-.04c13.26 6.08 27.6 6.08 40.7 0a.25.25 0 01.27.03c.4.34.83.67 1.26 1 .15.1.14.33-.02.43A41.44 41.44 0 0156 55.24a.26.26 0 00-.14.36A54.17 54.17 0 0060 62.35c.07.1.18.13.29.1a66.84 66.84 0 0020.26-10.27c.06-.04.1-.1.1-.18 1.69-17.55-2.83-32.78-11.97-46.3a.2.2 0 00-.11-.09zm-41.5 37.14c-4 0-7.28-3.67-7.28-8.2 0-4.51 3.22-8.19 7.28-8.19 4.08 0 7.34 3.71 7.28 8.2 0 4.52-3.23 8.2-7.28 8.2zm26.91 0c-3.99 0-7.28-3.67-7.28-8.2 0-4.51 3.23-8.19 7.28-8.19 4.09 0 7.35 3.71 7.28 8.2 0 4.52-3.2 8.2-7.28 8.2z"
                          fill="#5865F2"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0">
                          <path fill="#fff" d="M0 0h81v63H0z" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </a>
                <a
                  href="https://twitter.com/ArkadikoFinance/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col p-6 text-center border-t border-b border-gray-100 hover:bg-indigo-50 sm:border-0 sm:border-l sm:border-r"
                >
                  <p className="order-2 mt-4 text-sm leading-6 text-indigo-500">Twitter</p>
                  <div className="order-1 text-5xl font-extrabold text-indigo-600">
                    <svg
                      className="w-12 h-12 mx-auto"
                      viewBox="0 0 77 63"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M68.91 15.84c.05.67.05 1.34.05 2.02 0 20.6-15.77 44.37-44.61 44.37v-.01a44.56 44.56 0 01-24.04-7 31.6 31.6 0 0023.2-6.46A15.69 15.69 0 018.88 37.93c2.35.45 4.77.36 7.08-.27A15.62 15.62 0 013.37 22.38v-.2a15.65 15.65 0 007.12 1.95A15.57 15.57 0 015.63 3.31a44.58 44.58 0 0032.32 16.3 15.55 15.55 0 014.53-14.91 15.76 15.76 0 0122.19.68 31.57 31.57 0 009.95-3.79 15.67 15.67 0 01-6.89 8.63c3.11-.37 6.15-1.2 9-2.46a31.76 31.76 0 01-7.82 8.08z"
                        fill="#1D9BF0"
                      />
                    </svg>
                  </div>
                </a>
              </div>

              <p className="mt-8 text-center">
                <RouterLink
                  to="/onboarding/step-1-swap"
                  className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  Retake the onboarding
                </RouterLink>
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
