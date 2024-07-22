import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { StyledIcon } from '../components/ui/styled-icon';
import { ExternalLinkIcon } from "@heroicons/react/outline";

type Props = {
  open: boolean;
  closeModal: () => void;
  onProviderChosen: (arg0: string) => void;
};

export function ChooseWalletModal({
  open,
  closeModal,
  onProviderChosen
}: Props) {
  const [xVerseInstalled, setXVerseInstalled] = useState(false);

  useEffect(() => {
    if (window.XverseProviders?.StacksProvider || (window.StacksProvider && !window.StacksProvider.isHiroWallet)) {
      setXVerseInstalled(true);
    }
  }, [window.XverseProviders]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-zinc-600 dark:bg-opacity-80" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-zinc-800 sm:my-8 sm:align-middle sm:max-w-lg w-full sm:p-6">
              <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                <button
                  type="button"
                  className="text-gray-400 bg-white rounded-md dark:bg-zinc-800 hover:text-gray-500 dark:hover:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={closeModal}
                >
                  <span className="sr-only">Close</span>
                  <StyledIcon as="XIcon" solid={false} size={6} />
                </button>
              </div>

              <div>
                <div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 text-gray-900 dark:text-zinc-100 font-headings"
                  >
                    Choose wallet
                  </Dialog.Title>
                  <div className="mt-6 space-y-2">
                    <button onClick={() => { onProviderChosen('leather'); }} type="button" disabled={!window.LeatherProvider && !window.HiroWalletProvider} className="w-full flex items-center gap-x-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 hover:border-gray-500 bg-white hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-black text-gray-800 dark:text-zinc-200 dark:border-zinc-700 rounded-md dark:hover:border-gray-500 p-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:hover:border-gray-200 disabled:dark:bg-zinc-700">
                      <span>
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" rx="6" fill="black"/>
                        <path d="M29.1471 18.8085C32.3424 18.312 36.9634 14.9362 36.9634 12.305C36.9634 11.5106 36.3244 10.9645 35.3903 10.9645C33.6206 10.9645 30.6218 13.6454 29.1471 18.8085ZM14.35 31.8653C10.1714 31.8653 9.82725 36.0355 14.0058 36.0355C15.8739 36.0355 18.1353 35.2908 19.315 33.9503C17.5945 32.461 16.1688 31.8653 14.35 31.8653ZM40.9453 30.0781C41.1912 37.0781 37.6517 41 31.6542 41C28.1147 41 26.3449 39.6596 22.5596 37.1773C20.5932 39.3617 16.8571 41 13.76 41C3.09238 41 3.53481 27.3475 14.3991 27.3475C16.6604 27.3475 18.5777 27.9432 21.0357 29.4823L22.658 23.773C15.9722 21.9361 12.6294 16.773 15.9231 9.37588H21.2323C18.2828 14.2908 20.2983 18.3617 24.0344 18.8085C26.05 11.6099 30.3761 6 36.1277 6C39.3723 6 41.9286 8.13475 41.9286 12.0071C41.9286 18.2128 33.8664 23.2766 27.7706 23.773L25.2634 32.6596C28.1147 35.9858 36.0294 39.2128 36.0294 30.0781H40.9453Z" fill="#F5F1ED"/>
                        </svg>
                      </span>
                      <span className="flex flex-col text-left">
                        <span>Leather Wallet</span>
                        {!window.LeatherProvider && !window.HiroWalletProvider && (
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            Not installed -{' '}
                            <a
                              href="https://www.leather.io/"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="inline-flex items-center font-semibold hover:underline text-dark-green-500"
                            >
                              Download
                              <ExternalLinkIcon className="w-3 h-3 ml-1 text-dark-green-500 opacity-80" />
                            </a>
                          </span>
                        )}
                      </span>
                    </button>

                    <button type="button" onClick={() => { onProviderChosen('xverse'); }} disabled={!xVerseInstalled} className="w-full flex items-center gap-x-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 hover:border-gray-500 bg-white hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-black text-gray-800 dark:text-zinc-200 dark:border-zinc-700 rounded-md dark:hover:border-gray-500 p-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:hover:border-gray-200 disabled:dark:bg-zinc-700">
                      <span>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="48" height="48" rx="6" fill="#060606"/>
                          <path d="M42.4327 41.8387V35.2386C42.4327 34.9747 42.3008 34.7107 42.1687 34.5126L13.9862 6.264C13.7882 6.066 13.5242 6 13.2602 6H6.66001C6.33001 6 6.066 6.264 6.066 6.59403V12.7322C6.066 12.9962 6.198 13.2602 6.33001 13.4582L16.4282 23.5564C16.6922 23.8204 16.6922 24.1504 16.4282 24.4144L6.198 34.6447C6.066 34.7765 6 34.9086 6 35.0407V41.7729C6 42.1029 6.264 42.3669 6.59401 42.3669H17.6823C18.0123 42.3669 18.2763 42.1029 18.2763 41.7729V37.8126C18.2763 37.6808 18.3423 37.4826 18.4743 37.4168L23.9524 31.9386C24.2164 31.6747 24.5464 31.6747 24.8104 31.9386L34.9747 42.1029C35.1726 42.3008 35.4366 42.3669 35.7005 42.3669H41.8387C42.1687 42.4329 42.4327 42.1687 42.4327 41.8387Z" fill="white"/>
                          <path d="M27.5837 14.7122H33.1279C33.4579 14.7122 33.7219 14.9762 33.7219 15.3062V20.8503C33.7219 21.3783 34.3819 21.6423 34.7119 21.2463L42.302 13.6562C42.4341 13.5242 42.5001 13.3922 42.5001 13.2602V6.59403C42.5001 6.264 42.2362 6 41.9062 6H35.174C35.0419 6 34.844 6.066 34.778 6.198L27.1877 13.7222C26.7917 14.0522 27.0557 14.7122 27.5837 14.7122Z" fill="#EE7A30"/>
                        </svg>
                      </span>
                      <span className="flex flex-col text-left">
                        <span>Xverse Wallet</span>
                        {!xVerseInstalled && (
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            Not installed -{' '}
                            <a
                              href="https://www.xverse.app/"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="inline-flex items-center font-semibold hover:underline text-dark-green-500"
                            >
                              Download
                              <ExternalLinkIcon className="w-3 h-3 ml-1 text-dark-green-500 opacity-80" />
                            </a>
                          </span>
                        )}
                      </span>
                    </button>

                    <button type="button" onClick={() => { onProviderChosen('asigna'); }} disabled={!window.AsignaProvider} className="w-full flex items-center gap-x-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 hover:border-gray-500 bg-white hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-black text-gray-800 dark:text-zinc-200 dark:border-zinc-700 rounded-md dark:hover:border-gray-500 p-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:hover:border-gray-200 disabled:dark:bg-zinc-700">
                      <span>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_2402_17)">
                            <path d="M42 0H6C2.68629 0 0 2.68629 0 6V42C0 45.3137 2.68629 48 6 48H42C45.3137 48 48 45.3137 48 42V6C48 2.68629 45.3137 0 42 0Z" fill="#101011"/>
                            <g opacity="0.5" filter="url(#filter0_f_2402_17)">
                              <path d="M24 48C37.2548 48 48 43.4109 48 37.75C48 32.0891 37.2548 27.5 24 27.5C10.7452 27.5 0 32.0891 0 37.75C0 43.4109 10.7452 48 24 48Z" fill="url(#paint0_linear_2402_17)"/>
                            </g>
                            <g opacity="0.5" filter="url(#filter1_f_2402_17)">
                              <path d="M24 39.5C34.7952 39.5 43.5464 31.2173 43.5464 21C43.5464 10.7827 34.7952 2.5 24 2.5C13.2048 2.5 4.45361 10.7827 4.45361 21C4.45361 31.2173 13.2048 39.5 24 39.5Z" fill="url(#paint1_radial_2402_17)"/>
                            </g>
                            <path d="M22.9825 8.15135C21.8163 8.44705 20.7833 9.1611 20.0916 10.1731C20.0378 10.2487 19.9887 10.3245 19.9442 10.4025C19.9139 10.4451 19.8882 10.4902 19.8625 10.5349L19.1498 11.7906L19.0399 11.9845L18.2078 13.4483L18.1215 13.5995L15.9785 17.3687L15.9036 17.4963L15.1186 18.8798L15.0319 19.0312L14.2607 20.3883L14.1486 20.5895L11.4354 25.3613L11.3254 25.5504L10.6805 26.6854L10.6032 26.8248L9.38344 28.9672L8.79928 29.9957L8.14024 31.1569L8.04889 31.3153L6.32188 34.3538L6.13973 34.6754L5.91765 35.0633L5.78681 35.2974L5.24683 36.2455C5.22343 36.2859 5.20263 36.3284 5.18148 36.3708C5.1768 36.3757 5.17455 36.3805 5.17455 36.3827C5.04593 36.6477 4.97573 36.9219 4.95492 37.1939C4.86617 38.3382 5.66998 39.4354 6.86186 39.6011C6.91313 39.6104 6.96464 39.6151 7.01595 39.6199C7.06984 39.6221 7.12358 39.6246 7.17732 39.6246H9.50735L9.5798 39.5182L9.65694 39.4047L11.0941 37.3144L11.1853 37.1819L12.4637 35.321L12.5407 35.2074L13.2137 34.2285L13.2955 34.1101L13.693 33.5311C14.2023 32.7885 15.0343 32.4054 15.8662 32.4431C15.9108 32.4431 15.9574 32.4457 16.0019 32.4505C16.3266 32.481 16.6467 32.5755 16.9483 32.7412C16.9903 32.76 17.0324 32.7837 17.0721 32.8098C17.1165 32.8356 17.161 32.8642 17.2031 32.8949C17.9066 33.3913 18.285 34.186 18.285 34.9924V35.0112C18.285 35.0726 18.2827 35.1318 18.2758 35.1932C18.243 35.6285 18.1003 36.061 17.8364 36.4465L16.7847 37.9787L16.7076 38.0923L16.1723 38.8678L16.0719 39.0145L15.934 39.2156L15.7471 39.4873L15.6537 39.6246H19.0189C19.0797 39.6246 19.1426 39.6221 19.2033 39.6199C20.3838 39.5632 21.4727 38.9555 22.1529 37.9742L24.1042 35.1507L25.3966 33.2804L27.5465 30.1709C27.675 29.9864 27.827 29.828 27.9976 29.6979C28.091 29.627 28.1869 29.5655 28.2874 29.5111C28.3481 29.4804 28.4089 29.452 28.4698 29.4261H28.472C28.5117 29.4096 28.5514 29.3929 28.5913 29.3787C28.6473 29.3598 28.7057 29.3433 28.7641 29.3291C28.8156 29.3148 28.8693 29.3053 28.9231 29.2983C28.9348 29.2934 28.9465 29.2911 28.9605 29.2911C29.0049 29.2839 29.0515 29.277 29.0959 29.2747H29.0985C29.1544 29.2698 29.2105 29.2675 29.2666 29.2675C29.6989 29.2675 30.1359 29.4046 30.5098 29.6836C30.5613 29.7215 30.6103 29.7619 30.6571 29.8043C30.6946 29.8375 30.7274 29.8682 30.7599 29.9036C30.809 29.9533 30.8558 30.0078 30.8977 30.0621C30.9352 30.1093 30.9725 30.159 31.0052 30.2088C31.0799 30.3198 31.1432 30.438 31.1924 30.5585C31.2087 30.5964 31.2226 30.6343 31.2366 30.6721C31.2507 30.71 31.2624 30.7478 31.2741 30.7857C31.2975 30.866 31.3138 30.9463 31.3278 31.0268C31.3441 31.1072 31.3534 31.1877 31.3559 31.2682C31.3721 31.5707 31.3278 31.8759 31.2132 32.1665C31.155 32.3179 31.0777 32.4622 30.9842 32.6017L30.9283 32.6822V32.6842L29.9865 34.0488L28.8084 35.7585L28.3668 36.3992C28.2734 36.5364 28.1962 36.6807 28.1401 36.8248C28.1004 36.9218 28.07 37.0211 28.0489 37.1181C28.0373 37.1677 28.0281 37.2198 28.021 37.2696C28 37.4019 27.9953 37.5343 28.0022 37.6668C28.0047 37.6997 28.0069 37.733 28.0094 37.766C28.0185 37.863 28.035 37.9598 28.0583 38.057C28.0653 38.0854 28.0723 38.1113 28.0794 38.1373C28.1169 38.2672 28.1681 38.3951 28.229 38.5154C28.243 38.5416 28.257 38.5676 28.2709 38.5912C28.3037 38.6503 28.3389 38.7074 28.3784 38.7615C28.3784 38.764 28.3809 38.7663 28.3809 38.7663C28.4112 38.8087 28.4439 38.8513 28.4767 38.8915C28.4954 38.9151 28.514 38.9366 28.5351 38.9603C28.5679 38.9957 28.6006 39.0313 28.6355 39.0643C28.6402 39.069 28.6449 39.076 28.6519 39.0784C28.694 39.1186 28.7384 39.1565 28.7828 39.1944C28.7875 39.1967 28.7897 39.199 28.7922 39.2014C28.8179 39.2226 28.8435 39.2415 28.8715 39.2603C28.8949 39.2771 28.9184 39.2935 28.9418 39.3077C28.9861 39.3361 29.033 39.3645 29.0797 39.3882C29.1193 39.4118 29.1614 39.4307 29.2033 39.4496C29.2059 39.4521 29.208 39.452 29.208 39.452C29.2526 39.4732 29.297 39.4898 29.3436 39.5064C29.4302 39.5371 29.5214 39.5632 29.6148 39.5822C29.6429 39.5892 29.6731 39.5939 29.7036 39.5985C29.7597 39.6081 29.8158 39.6151 29.8741 39.6176C29.9255 39.6221 29.9769 39.6246 30.0309 39.6246H41.5101C41.6714 39.6246 41.8303 39.6082 41.9799 39.5773C42.0172 39.5703 42.0546 39.5608 42.0921 39.5513C42.2018 39.5231 42.3094 39.4873 42.4122 39.4426C42.4543 39.4236 42.4965 39.4047 42.5384 39.3834C42.5757 39.3668 42.6109 39.348 42.6459 39.3266C42.6506 39.3219 42.6553 39.3196 42.6599 39.3172C42.7533 39.2653 42.8421 39.2037 42.9263 39.1374C42.9426 39.1257 42.9591 39.1114 42.9754 39.0972C43.0151 39.0642 43.0525 39.0313 43.0898 38.9957C43.1319 38.9555 43.1716 38.9129 43.2113 38.8678C43.2488 38.8301 43.284 38.7899 43.3165 38.7497C43.3656 38.6834 43.4148 38.6149 43.4592 38.5465C43.4755 38.5204 43.4919 38.4919 43.5082 38.4637C43.5455 38.3974 43.5829 38.3266 43.6157 38.2555C43.6273 38.2247 43.6415 38.1942 43.653 38.1631C43.6857 38.0854 43.7116 38.0071 43.735 37.9268C43.7466 37.8889 43.7559 37.8536 43.7631 37.8157C43.7722 37.7825 43.7792 37.7494 43.7839 37.7164C43.7863 37.7046 43.7887 37.6904 43.791 37.6785L43.7979 37.6431C43.805 37.5982 43.8097 37.5508 43.8144 37.5034C43.819 37.4561 43.8237 37.4089 43.8237 37.3593C43.8377 36.9383 43.7372 36.5009 43.4989 36.0921L40.8255 31.5281L40.7202 31.3485L40.3977 30.7976L39.8485 29.861V29.8587L39.8367 29.8396L39.7618 29.7121L37.5863 25.9996L37.4857 25.827L37.4181 25.7111L36.086 23.4364L36.0111 23.3111L35.6722 22.7292L35.5297 22.4904L35.3639 22.2043L34.464 20.6674L34.2561 20.3127L34.1087 20.0621L30.4982 13.8951L30.428 13.7768L29.2245 11.7197L29.1498 11.5942L28.4954 10.4758C28.3951 10.3055 28.2874 10.1424 28.1682 9.98875C28.1122 9.913 28.0536 9.8374 27.9906 9.76655C27.9766 9.7476 27.9601 9.72865 27.9414 9.7097C27.8995 9.6599 27.8551 9.61045 27.8083 9.5631C27.4904 9.22495 27.1283 8.9364 26.7356 8.70225C26.7147 8.68825 26.6913 8.67405 26.6701 8.6623C26.572 8.60545 26.4715 8.55105 26.3687 8.50125C25.9855 8.31465 25.5788 8.1775 25.1558 8.0947C24.8426 8.03315 24.5224 8 24.1954 8C23.7818 8 23.3727 8.0521 22.9825 8.15135Z" fill="url(#paint2_linear_2402_17)"/>
                            <path d="M29.4349 26.7327C29.4044 26.7729 29.3741 26.8153 29.3435 26.8579C28.6776 27.7919 28.2896 28.7851 28.1144 29.3148C28.0981 29.3597 28.0841 29.4046 28.0723 29.4425C28.021 29.6033 27.9976 29.6979 27.9976 29.6979C28.091 29.627 28.1868 29.5654 28.2874 29.5111C28.3481 29.4804 28.4089 29.452 28.4697 29.426H28.472C28.5117 29.4071 28.5514 29.3928 28.5912 29.3786C28.6472 29.3597 28.7056 29.3432 28.7641 29.329C28.8155 29.3148 28.8693 29.3053 28.923 29.2983C28.9348 29.2934 28.9464 29.2911 28.9605 29.2911C29.0048 29.2839 29.0515 29.2769 29.0958 29.2746H29.0984C29.1544 29.2697 29.2104 29.2674 29.2666 29.2674C29.6989 29.2674 30.1359 29.4046 30.5098 29.6836C30.5613 29.7215 30.6103 29.7619 30.6571 29.8043C30.6946 29.8375 30.7273 29.8682 30.7599 29.9036C30.809 29.9532 30.8558 30.0078 30.8977 30.0621C30.9376 30.1093 30.9724 30.1567 31.0052 30.2088C31.0799 30.3198 31.1431 30.438 31.1924 30.5585C31.2087 30.5964 31.2226 30.6343 31.2366 30.6721C31.2506 30.71 31.2624 30.7477 31.274 30.7856C31.2974 30.8659 31.3137 30.9463 31.3278 31.0268C31.3418 31.1071 31.3512 31.1876 31.3558 31.2681C31.3722 31.5707 31.3278 31.8759 31.2132 32.1665C31.155 32.3178 31.0776 32.4622 30.9842 32.6016L30.9282 32.6821V32.6842L29.9864 34.0488L28.8085 35.7585L28.3668 36.3992C28.2733 36.5363 28.1962 36.6807 28.14 36.8248C28.1028 36.9218 28.0723 37.0211 28.0489 37.1181C28.0372 37.1677 28.028 37.2198 28.021 37.2696C28 37.4019 27.9953 37.5343 28.0023 37.6667C28.0047 37.6997 28.0069 37.733 28.0093 37.766C28.0185 37.863 28.035 37.9598 28.0582 38.057C28.0654 38.0854 28.0723 38.1113 28.0794 38.1373C28.1168 38.2672 28.1681 38.3951 28.2289 38.5154C28.243 38.5391 28.2546 38.5628 28.2663 38.5866L28.2709 38.5912C28.3037 38.6503 28.3389 38.7073 28.3784 38.7615C28.3784 38.764 28.3808 38.7662 28.3808 38.7662C28.4112 38.8087 28.4439 38.8513 28.4767 38.8915C28.4954 38.9151 28.5139 38.9365 28.5351 38.9602C28.5679 38.9956 28.6006 39.0313 28.6355 39.0642C28.6401 39.069 28.6448 39.076 28.6519 39.0784C28.6941 39.1186 28.7384 39.1565 28.7828 39.1944C28.7875 39.1966 28.7897 39.1989 28.7921 39.2014C28.8178 39.2226 28.8434 39.2415 28.8716 39.2603C28.895 39.2771 28.9183 39.2935 28.9417 39.3077C28.9861 39.3361 29.0329 39.3645 29.0797 39.3882C29.1192 39.4118 29.1614 39.4306 29.2033 39.4495C29.2059 39.452 29.208 39.452 29.208 39.452C29.2525 39.4732 29.2969 39.4897 29.3435 39.5064C29.4302 39.5371 29.5214 39.5632 29.6148 39.5822C29.6429 39.5892 29.6731 39.5939 29.7036 39.5985C29.7598 39.6081 29.8157 39.6151 29.8741 39.6176C29.9254 39.6221 29.9769 39.6246 30.0308 39.6246H41.5102C41.6713 39.6246 41.8303 39.6081 41.9799 39.5772C42.0172 39.5702 42.0546 39.5608 42.092 39.5513C42.2017 39.523 42.3094 39.4873 42.4122 39.4425C42.4543 39.4236 42.4964 39.4047 42.5384 39.3834C42.5757 39.3668 42.6108 39.348 42.6459 39.3266L42.6599 39.3196V39.3171C42.7534 39.2652 42.8421 39.2037 42.9263 39.1374C42.9426 39.1256 42.9591 39.1114 42.9754 39.0972C43.0151 39.0642 43.0525 39.0313 43.0898 38.9956C43.1319 38.9555 43.1716 38.9129 43.2113 38.8678C43.2487 38.8301 43.2839 38.7899 43.3165 38.7497C43.3656 38.6834 43.4148 38.6149 43.4592 38.5465C43.4755 38.5203 43.492 38.4919 43.5082 38.4637C43.5455 38.3974 43.583 38.3265 43.6157 38.2555C43.6273 38.2246 43.6416 38.1941 43.653 38.1631C43.6857 38.0854 43.7116 38.0071 43.735 37.9268C43.7466 37.8889 43.7559 37.8535 43.763 37.8156C43.7722 37.7825 43.7792 37.7493 43.7838 37.7163C43.7887 37.6927 43.7932 37.669 43.7958 37.6453L43.7979 37.643C43.805 37.5981 43.8097 37.5508 43.8144 37.5034C43.8191 37.4561 43.8237 37.4089 43.8237 37.3593C43.8378 36.9383 43.7372 36.5009 43.4989 36.0921L40.8254 31.5281L40.7202 31.3485L40.3976 30.7976L39.8485 29.861V29.8587L39.8367 29.8396L39.7618 29.7121L37.5862 25.9996C37.5256 25.9617 37.4647 25.9215 37.4039 25.8838C37.3619 25.8577 37.3198 25.834 37.2754 25.8081C36.315 25.2382 35.0856 24.7487 33.6344 24.6682C33.5876 24.6636 33.541 24.6612 33.4942 24.6612C33.3961 24.6564 33.2978 24.654 33.1972 24.654C31.4702 24.654 30.2549 25.6355 29.4349 26.7327Z" fill="url(#paint3_linear_2402_17)"/>
                            <path d="M18.2861 34.9927C18.2861 35.4959 18.1406 36.0024 17.8363 36.4473L15.6544 39.6235H9.5083L13.6926 33.5313C14.4873 32.3744 16.0604 32.0903 17.2035 32.8946C17.9072 33.391 18.2861 34.1852 18.2861 34.9927Z" fill="white"/>
                            <path d="M16.4021 35.2803C16.4021 35.8068 15.9802 36.2339 15.4599 36.2339C14.9395 36.2339 14.5176 35.8068 14.5176 35.2803C14.5176 34.7538 14.9395 34.3267 15.4599 34.3267C15.9802 34.3267 16.4021 34.7538 16.4021 35.2803Z" fill="black"/>
                          </g>
                          <defs>
                            <filter id="filter0_f_2402_17" x="-11.5" y="16" width="71" height="43.5" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                              <feGaussianBlur stdDeviation="5.75" result="effect1_foregroundBlur_2402_17"/>
                            </filter>
                            <filter id="filter1_f_2402_17" x="-9.54639" y="-11.5" width="67.0928" height="65" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                              <feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur_2402_17"/>
                            </filter>
                            <linearGradient id="paint0_linear_2402_17" x1="48" y1="37.75" x2="0" y2="37.75" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#6A3300" stopOpacity="0"/>
                              <stop offset="0.520833" stopColor="#8A2FFF"/>
                              <stop offset="1" stopColor="#6A3300" stopOpacity="0"/>
                            </linearGradient>
                            <radialGradient id="paint1_radial_2402_17" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 21) rotate(180) scale(19.5464 1336.62)">
                              <stop stopColor="#3974E8" stopOpacity="0"/>
                              <stop offset="0.520833" stopColor="#7B3DFF"/>
                              <stop offset="1" stopColor="#00316A" stopOpacity="0"/>
                            </radialGradient>
                            <linearGradient id="paint2_linear_2402_17" x1="23.1715" y1="43.1148" x2="30.4582" y2="9.23415" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#6522F4"/>
                              <stop offset="0.5538" stopColor="#9B6BFF"/>
                              <stop offset="1" stopColor="#A585FF"/>
                            </linearGradient>
                            <linearGradient id="paint3_linear_2402_17" x1="35.4166" y1="41.2768" x2="39.366" y2="25.484" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#421F8B"/>
                              <stop offset="0.5538" stopColor="#7230FF"/>
                              <stop offset="1" stopColor="#9773FF"/>
                            </linearGradient>
                            <clipPath id="clip0_2402_17">
                              <rect width="48" height="48" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                      </span>
                      <span className="flex flex-col text-left">
                        <span>Asigna Wallet</span>
                        {!window.AsignaProvider && (
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            Not installed -{' '}
                            <a
                              href="https://www.asigna.io/"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="inline-flex items-center font-semibold hover:underline text-dark-green-500"
                            >
                              Download
                              <ExternalLinkIcon className="w-3 h-3 ml-1 text-dark-green-500 opacity-80" />
                            </a>
                          </span>
                        )}
                      </span>
                    </button>

                    <button type="button" onClick={() => { onProviderChosen('orange'); }} disabled={!window.OrangeStacksProvider} className="w-full flex items-center gap-x-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 hover:border-gray-500 bg-white hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-black text-gray-800 dark:text-zinc-200 dark:border-zinc-700 rounded-md dark:hover:border-gray-500 p-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:hover:border-gray-200 disabled:dark:bg-zinc-700">
                      <span>
                        <img src="/assets/orange-wallet.png" className="w-12 h-12" />
                      </span>
                      <span className="flex flex-col text-left">
                        <span>Orange Wallet</span>
                        {!window.OrangeStacksProvider && (
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            Not installed -{' '}
                            <a
                              href="https://www.orangecrypto.com/"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="inline-flex items-center font-semibold hover:underline text-dark-green-500"
                            >
                              Download
                              <ExternalLinkIcon className="w-3 h-3 ml-1 text-dark-green-500 opacity-80" />
                            </a>
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
