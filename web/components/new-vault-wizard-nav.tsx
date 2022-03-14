import React from 'react';
import { CheckIcon } from '@heroicons/react/solid';
import { classNames } from '@common/class-names';
import { NavLink as RouterLink } from 'react-router-dom';

export const NewVaultWizardNav = ({ currentSection, setStep }) => {
  const vaultCreationSections = [
    {
      id: '01',
      name: 'Collateral',
      description: 'Choose your type of collateral',
      href: '/vaults/new',
      status: 'current',
    },
    {
      id: '02',
      name: 'Details',
      description: 'Collateral amount and USDA minting',
      href: '#',
      status: 'upcoming',
    },
    {
      id: '03',
      name: 'Confirmation',
      description: 'Ready to open your vault?',
      href: '#',
      status: 'upcoming',
    },
  ];

  vaultCreationSections.forEach((section, index) => {
    if (index < currentSection) {
      section.status = 'complete';
    } else if (index === currentSection) {
      section.status = 'current';
    } else {
      section.status = 'upcoming';
    }
  });

  return (
    <div className="relative overflow-hidden rounded-md lg:border-t lg:border-b lg:border-gray-200 dark:lg:border-zinc-600">
      <nav className="bg-white dark:bg-zinc-800" aria-label="New Vault Wizard Navigation">
        <ol
          role="list"
          className="overflow-hidden lg:flex lg:border-l lg:border-r lg:border-gray-200 dark:lg:border-zinc-600"
        >
          {vaultCreationSections.map((section, sectionIdx) => (
            <li key={section.id} className="relative overflow-hidden lg:flex-1">
              <div
                className={classNames(
                  sectionIdx === 0 ? 'border-b-0' : '',
                  sectionIdx === vaultCreationSections.length - 1 ? 'border-t-0' : '',
                  'border border-gray-200 dark:border-zinc-600 overflow-hidden lg:border-0'
                )}
              >
                {section.status === 'complete' ? (
                  <button
                    onClick={() => {
                      setStep(sectionIdx);
                    }}
                    className="group"
                  >
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
                        <span className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full dark:bg-indigo-400">
                          <CheckIcon
                            className="w-6 h-6 text-white dark:text-zinc-700"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                      <span className="mt-0.5 ml-4 min-w-0 flex flex-col">
                        <span className="text-base text-left font-headings">{section.name}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                          {section.description}
                        </span>
                      </span>
                    </span>
                  </button>
                ) : section.status === 'current' ? (
                  <RouterLink to={section.href} aria-current="step">
                    <span
                      className="absolute top-0 left-0 w-1 h-full bg-indigo-600 dark:bg-indigo-400 lg:w-full lg:h-1 lg:bottom-0 lg:top-auto"
                      aria-hidden="true"
                    />
                    <span
                      className={classNames(
                        sectionIdx !== 0 ? 'lg:pl-9' : '',
                        'px-6 py-5 flex items-start text-sm font-medium'
                      )}
                    >
                      <span className="shrink-0">
                        <span className="flex items-center justify-center w-10 h-10 border-2 border-indigo-600 rounded-full dark:border-indigo-400">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {section.id}
                          </span>
                        </span>
                      </span>
                      <span className="mt-0.5 ml-4 min-w-0 flex flex-col">
                        <span className="text-base text-indigo-600 dark:text-indigo-400 font-headings">
                          {section.name}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">
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
                          <span className="text-gray-500 dark:text-zinc-400">{section.id}</span>
                        </span>
                      </span>
                      <span className="mt-0.5 ml-4 min-w-0 flex flex-col">
                        <span className="text-base text-gray-500 dark:text-zinc-400 font-headings">
                          {section.name}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">
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
                        className="w-full h-full text-gray-300 dark:text-zinc-700"
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
  );
};
