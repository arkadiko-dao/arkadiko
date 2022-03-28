import React from 'react';
import { classNames } from '@common/class-names';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from '@components/ui/styled-icon';

export const OnboardingNav = props => {
  const onboardingSections = [
    {
      id: '01',
      name: 'Swap',
      description: 'Exchange your favorite tokens easily.',
      href: '/onboarding/step-1-swap',
      status: 'current',
    },
    {
      id: '02',
      name: 'Vaults',
      description: 'Deposit STX and generate USDA.',
      href: '/onboarding/step-2-vaults',
      status: 'upcoming',
    },
    {
      id: '03',
      name: 'Staking',
      description: 'Stake your tokens to earn rewards.',
      href: '/onboarding/step-3-staking',
      status: 'upcoming',
    },
    {
      id: '04',
      name: 'Governance',
      description: 'Vote on proposals.',
      href: '/onboarding/step-4-governance',
      status: 'upcoming',
    },
  ];

  onboardingSections.forEach((section, index) => {
    const currentSection = props.currentSection;
    if (index < currentSection) {
      section.status = 'complete';
    } else if (index === currentSection) {
      section.status = 'current';
    } else {
      section.status = 'upcoming';
    }
  });

  return (
    <>
      <div className="relative sticky top-0 shadow-sm lg:border-t lg:border-b lg:border-gray-200">
        <nav className="bg-white" aria-label="Onboarding Progress">
          <ol
            role="list"
            className="overflow-hidden lg:flex lg:border-l lg:border-r lg:border-gray-200"
          >
            {onboardingSections.map((section, sectionIdx) => (
              <li key={section.id} className="relative overflow-hidden lg:flex-1">
                <div
                  className={classNames(
                    sectionIdx === 0 ? 'border-b-0' : '',
                    sectionIdx === onboardingSections.length - 1 ? 'border-t-0' : '',
                    'border border-gray-200 overflow-hidden lg:border-0'
                  )}
                >
                  {section.status === 'complete' ? (
                    <RouterLink to={section.href} className="group">
                      <span
                        className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-gray-200 lg:w-full lg:h-1 lg:bottom-0 lg:top-auto"
                        aria-hidden="true"
                      />
                      <span
                        className={classNames(
                          sectionIdx !== 0 ? 'lg:pl-9' : '',
                          'px-6 py-5 flex items-start text-sm font-medium'
                        )}
                      >
                        <span className="shrink-0">
                          <span className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full">
                            <StyledIcon as="CheckIcon" size={6} className="text-white" />
                          </span>
                        </span>
                        <span className="mt-0.5 ml-4 min-w-0 flex flex-col">
                          <span className="text-base font-headings">{section.name}</span>
                          <span className="text-sm font-medium text-gray-500">
                            {section.description}
                          </span>
                        </span>
                      </span>
                    </RouterLink>
                  ) : section.status === 'current' ? (
                    <RouterLink to={section.href} aria-current="step">
                      <span
                        className="absolute top-0 left-0 w-1 h-full bg-indigo-600 lg:w-full lg:h-1 lg:bottom-0 lg:top-auto"
                        aria-hidden="true"
                      />
                      <span
                        className={classNames(
                          sectionIdx !== 0 ? 'lg:pl-9' : '',
                          'px-6 py-5 flex items-start text-sm font-medium'
                        )}
                      >
                        <span className="shrink-0">
                          <span className="flex items-center justify-center w-10 h-10 border-2 border-indigo-600 rounded-full">
                            <span className="text-indigo-600">{section.id}</span>
                          </span>
                        </span>
                        <span className="mt-0.5 ml-4 min-w-0 flex flex-col">
                          <span className="text-base text-indigo-600 font-headings">
                            {section.name}
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            {section.description}
                          </span>
                        </span>
                      </span>
                    </RouterLink>
                  ) : (
                    <RouterLink to={section.href} className="group">
                      <span
                        className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-gray-200 lg:w-full lg:h-1 lg:bottom-0 lg:top-auto"
                        aria-hidden="true"
                      />
                      <span
                        className={classNames(
                          sectionIdx !== 0 ? 'lg:pl-9' : '',
                          'px-6 py-5 flex items-start text-sm font-medium'
                        )}
                      >
                        <span className="shrink-0">
                          <span className="flex items-center justify-center w-10 h-10 border-2 border-gray-300 rounded-full">
                            <span className="text-gray-500">{section.id}</span>
                          </span>
                        </span>
                        <span className="mt-0.5 ml-4 min-w-0 flex flex-col">
                          <span className="text-base text-gray-500 font-headings">
                            {section.name}
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            {section.description}
                          </span>
                        </span>
                      </span>
                    </RouterLink>
                  )}

                  {sectionIdx !== 0 ? (
                    <>
                      {/* Separator */}
                      <div
                        className="absolute inset-0 top-0 left-0 hidden w-3 lg:block"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-full h-full text-gray-300"
                          viewBox="0 0 12 82"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0.5 0V31L10.5 41L0.5 51V82"
                            stroke="currentcolor"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <div className="relative hidden sm:block bg-yellow-50">
        <div className="px-3 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="shrink-0">
              <StyledIcon as="ExclamationIcon" size={5} className="text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-yellow-700">
                Arkadiko is beta software.{' '}
                <span className="font-semibold">
                  Do not deposit anything that you are not willing to lose.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-right">
        <RouterLink
          to="/"
          className="flex items-center justify-end p-4 text-base font-medium text-gray-700 sm:text-xs hover:text-gray-800 hover:underline"
        >
          Skip the onboarding
          <StyledIcon as="ArrowNarrowRightIcon" size={4} className="ml-2 text-gray-800" />
        </RouterLink>
      </p>
    </>
  );
};
