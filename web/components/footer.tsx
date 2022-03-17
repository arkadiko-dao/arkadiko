import React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import { StyledIcon } from './ui/styled-icon';

export const Footer = () => {
  return (
    <footer className="bg-white shadow-sm dark:bg-zinc-900 ring-1 ring-gray-900 ring-opacity-5">
      <div className="px-6 py-8 mx-auto max-w-7xl lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div className="col-span-2 sm:col-span-1 md:col-span-2 sm:pr-16">
            <div className="flex items-center">
              <RouterLink className="flex items-center shrink-0" to="/">
                <svg className="w-auto h-6 lg:block sm:h-8 text-zinc-900 dark:text-white" viewBox="0 0 60 46"><path fillRule="evenodd" clipRule="evenodd" d="M19.03 1.54A2.68 2.68 0 0121.46 0h11.48c.95 0 1.82.49 2.3 1.29L59.62 41.6c.5.82.5 1.84.03 2.66a2.69 2.69 0 01-2.33 1.34h-12a2.7 2.7 0 01-1.9-.77 31.32 31.32 0 00-16.15-8.17c-6.8-1.09-14.81.4-22.7 8.17a2.71 2.71 0 01-3.42.3 2.62 2.62 0 01-.9-3.28L19.02 1.54zm7.1 3.75L46.86 40.3h5.74L31.42 5.3h-5.29zm10.89 28.89L21.75 8.37 9.55 34.55a29.17 29.17 0 0118.58-3.1c3.2.5 6.2 1.5 8.89 2.73z" fill="currentColor"/></svg>
                <span className="inline-block ml-2 text-lg font-bold align-middle font-headings text-zinc-900 dark:text-zinc-100">
                  Arkadiko
                </span>
              </RouterLink>
            </div>
            <div className="mt-4 text-sm">We bring DeFi to Bitcoin. Arkadiko is an open source and non-custodial liquidity protocol for minting stablecoins, earning interest on deposits and borrowing assets on Stacks.</div>
            <div className="flex mt-6 space-x-6 md:order-2">
              <a href="https://arkadikofinance.medium.com/" target="_blank" rel="noopener noreferrer" className="transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                <span className="sr-only">Medium</span>
                <svg className="w-6 h-6" fill="currentColor" clipRule="evenodd">
                  <path
                    d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.958l5.378 11.795 4.728-11.795h6.633v.403l-1.916 1.837c-.165.126-.247.333-.213.538v13.498c-.034.204.048.411.213.537l1.871 1.837v.403h-9.412v-.403l1.939-1.882c.19-.19.19-.246.19-.537v-10.91l-5.389 13.688h-.728l-6.275-13.688v9.174c-.052.385.076.774.347 1.052l2.521 3.058v.404h-7.148v-.404l2.521-3.058c.27-.279.39-.67.325-1.052v-10.608z"
                  ></path>
                </svg>
              </a>
              <a href="https://app.sigle.io/arkadiko.id.stx" target="_blank" rel="noopener noreferrer" className="transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                <span className="sr-only">Sigle</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.46 3.7C16.42 2.37 13.7.42 10.87 2.21L6.2 5.16a4.8 4.8 0 0 0-1.3 7l1.18 1.55c.04.08.04.16-.04.24l-2.26 1.43a.7.7 0 0 0-.27.44c-.03.16 0 .36.12.52l3.3 4.25.15.16a4.47 4.47 0 0 0 6.2.88s.04 0 .04-.04l4.6-2.9c.08-.05 2.07-1.28 2.41-3.3.23-1.2-.11-2.35-1.03-3.5l-1.34-1.76c-.04-.08-.04-.16.04-.24l2.22-1.43a.49.49 0 0 0 .27-.43.65.65 0 0 0-.12-.52l-2.91-3.82Zm-11.6 7.67c-.55-.72-.81-1.6-.7-2.5a3.59 3.59 0 0 1 1.5-2.51l.15-.08c.88-.52 2-.6 3.03-.16.5.24.91.63 1.26 1.07l.57.76c.04.08.04.16-.03.24l-3.07 1.94-.15.12c-.35.28-.58.72-.65 1.2a2 2 0 0 0 .34 1.3l1.96 2.6c.07.11.11.23.11.39 0 .12-.08.28-.2.36-.22.16-.53.16-.68-.08l-3.45-4.65Zm4.01-.08 2.5 3.26-.96.6c-.08-.24-.16-.48-.31-.68l-1.95-2.59a.69.69 0 0 1-.12-.4c0-.11.08-.27.2-.35A.63.63 0 0 1 9.6 11c.07.12.19.2.26.28Zm4.06 6.56c0 1.07-.46 2.03-1.26 2.7A3.26 3.26 0 0 1 8 20l-2.88-3.77c-.03-.08-.03-.16.04-.24l1.69-1.07c.07-.04.15-.04.19.03l1.15 1.52.19.23c.54.68 1.46.88 2.18.44 0 0 .04 0 .04-.04l2.5-1.59c.49.72.83 1.51.83 2.35Zm4.45-5.17c.65.87.92 1.7.76 2.5-.26 1.47-1.83 2.47-1.83 2.47l-2.34 1.47c.08-.24.11-.48.15-.72a4.7 4.7 0 0 0-.96-3.46l-3.33-4.4c-.08-.09-.11-.17-.19-.2l1.84-1.16c.08-.04.15-.04.19.04l1.72 2.27c.23.31.66.4 1 .2l1.38-.88c.08-.04.15-.04.2.04l1.4 1.83Zm-1.8-3.3-1.42.87c-.08.04-.15.04-.2-.04l-2.98-3.9a4.53 4.53 0 0 0-2.3-1.58c-.11-.04-.11-.2-.04-.28l1.84-1.16c2.6-1.63 4.87 1.04 5.02 1.2l2.41 3.18c.04.08.04.16-.03.24l-2.15 1.35-.15.12Z"/>
                </svg>
              </a>
              <a href="https://twitter.com/ArkadikoFinance" target="_blank" rel="noopener noreferrer" className="transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                  ></path>
                </svg>
              </a>
              <a href="https://github.com/arkadiko-dao/arkadiko" target="_blank" rel="noopener noreferrer" className="transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                <span className="sr-only">GitHub</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
              <a href="https://discord.gg/7UB6JjjCNV" target="_blank" rel="noopener noreferrer" className="transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                <span className="sr-only">Discord</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.93 5.34a16.89 16.89 0 00-4.07-1.23c-.03 0-.05.01-.07.03-.17.3-.37.7-.5 1.01a15.72 15.72 0 00-4.57 0c-.14-.32-.34-.7-.52-1a.06.06 0 00-.06-.04 16.84 16.84 0 00-4.1 1.25A15.95 15.95 0 002.1 16.42a16.8 16.8 0 005 2.45c.02 0 .05 0 .06-.02.39-.51.73-1.05 1.02-1.61a.06.06 0 00-.03-.09c-.54-.2-1.06-.44-1.56-.72a.06.06 0 010-.1l.3-.24a.06.06 0 01.07 0 12.18 12.18 0 0010.05 0h.06l.32.24c.03.03.03.08-.01.1-.5.28-1.02.52-1.56.72a.06.06 0 00-.04.09c.3.56.65 1.1 1.03 1.6.01.03.04.04.07.03a16.75 16.75 0 005.02-2.49 15.85 15.85 0 00-2.98-11.04zM8.68 14.18c-.98 0-1.8-.88-1.8-1.95 0-1.08.8-1.95 1.8-1.95 1.01 0 1.82.88 1.8 1.95 0 1.07-.8 1.95-1.8 1.95zm6.65 0c-.99 0-1.8-.88-1.8-1.95 0-1.08.8-1.95 1.8-1.95s1.81.88 1.8 1.95c0 1.07-.8 1.95-1.8 1.95z"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase dark:text-white font-headings">Protocol</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="https://arkadiko.finance/arkadiko-whitepaper.pdf" className="text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">Whitepaper</a></li>
              <li><a href="https://docs.arkadiko.finance/" target="_blank" rel="noopener noreferrer" className="text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">Documentation</a></li>
              <li><a href="https://github.com/arkadiko-dao/arkadiko/blob/master/SECURITY.md" target="_blank" rel="noopener noreferrer" className="text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">Bug Bounty</a></li>
              <li><a href="https://arkadiko.finance/brand" className="text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">Brand</a></li>
              <li><a href="https://arkadiko.finance/arkadiko-EULA.pdf" className="text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">EULA</a></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase dark:text-white font-headings">Misc</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="https://info.arkadiko.finance/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                  <StyledIcon as="TrendingUpIcon" size={5} className="mr-2 text-indigo-600 dark:text-indigo-300" />
                  Analytics
                </a>
              </li>
              <li>
                <a href="https://www.hiro.so/wallet" target="_blank" rel="noopener noreferrer" className="inline-flex text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                  <svg className="flex-shrink-0 w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-300" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" /></svg>
                  Hiro Wallet
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-indigo-100 text-indigo-800">
                    Web
                  </span>
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-indigo-100 text-indigo-800">
                    Desktop
                  </span>
                </a>
              </li>
              <li>
                <a href="https://www.xverse.app/" target="_blank" rel="noopener noreferrer" className="inline-flex text-base transition duration-300 hover:text-gray-700 dark:hover:text-zinc-300">
                  <svg className="flex-shrink-0 w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-300" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" /></svg>
                  Xverse Wallet
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-indigo-100 text-indigo-800">
                    Mobile
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
