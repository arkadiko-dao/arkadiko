import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { stacksNetwork as network } from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { useSTXAddress } from '@common/use-stx-address';
import { Placeholder } from '../../web/components/ui/placeholder';
import { microToReadable } from '@common/vault-utils';
import {
  AnchorMode,
  uintCV,
  standardPrincipalCV,
  callReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';
import { GiftIcon, LinkIcon } from '@heroicons/react/solid';
import { Alert } from './ui/alert';

export const LydianAirdrop = () => {
  const stxAddress = useSTXAddress();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const { doContractCall } = useConnect();

  const [state, setState] = useContext(AppContext);
  const [claimAmount1, setClaimAmount1] = useState(0);
  const [claimAmount2, setClaimAmount2] = useState(0);
  const [claimAmount3, setClaimAmount3] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    const fetchClaimed = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-2',
        functionName: 'get-claimed',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value;
      return result;
    };

    const fetchLdnForStdiko = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-2',
        functionName: 'get-ldn-for-stdiko-pool',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchLdnForDikoUsda = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-2',
        functionName: 'get-ldn-for-diko-usda-pool',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchLdnForWstxDiko = async () => {
      const call = await callReadOnlyFunction({
        contractAddress,
        contractName: 'lydian-airdrop-v1-2',
        functionName: 'get-ldn-for-wstx-diko-pool',
        functionArgs: [
          standardPrincipalCV(stxAddress || ''),
          uintCV(47500),
        ],
        senderAddress: stxAddress || '',
        network: network,
      });
      const result = cvToJSON(call).value.value;
      return parseInt(result);
    };

    const fetchInfo = async () => {
      // Fetch all info
      const [
        ldnForStdiko,
        ldnForDikoUsda,
        ldnForWstxDiko,
        claimed
      ] = await Promise.all([
        fetchLdnForStdiko(),
        fetchLdnForDikoUsda(),
        fetchLdnForWstxDiko(),
        fetchClaimed()
      ]);

      const claimed1 = claimed['amount-stdiko'].value;
      const claimed2 = claimed['amount-diko-usda'].value;
      const claimed3 = claimed['amount-wstx-diko'].value;

      setClaimAmount1(ldnForStdiko - claimed1);
      setClaimAmount2(ldnForDikoUsda - claimed2);
      setClaimAmount3(ldnForWstxDiko - claimed3);

      setIsLoading(false);
    };

    fetchInfo();
  }, []);

  const claim1 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-2',
      functionName: 'claim-ldn-for-stdiko-pool',
      functionArgs: [
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const claim2 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-2',
      functionName: 'claim-ldn-for-diko-usda-pool',
      functionArgs: [
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  const claim3 = async () => {
    await doContractCall({
      network,
      contractAddress,
      stxAddress,
      contractName: 'lydian-airdrop-v1-2',
      functionName: 'claim-ldn-for-wstx-diko-pool',
      functionArgs: [
      ],
      postConditionMode: 0x01,
      onFinish: data => {
        setState(prevState => ({
          ...prevState,
          currentTxId: data.txId,
          currentTxStatus: 'pending',
        }));
      },
      anchorMode: AnchorMode.Any,
    });
  };

  return (
    <>
      {state.userData ? (
        <Container>
          <main className="flex-1 py-12">
            <section>
              <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
                <div>
                  <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Lydian Airdrop
                  </h3>
                </div>
              </header>
              <div className="flex flex-col items-center justify-center flex-1 py-12">
                <div className="relative w-full max-w-4xl">
                  <div className="absolute top-0 bg-indigo-200 rounded-full dark:bg-indigo-200 -left-8 w-80 h-80 mix-blend-multiply filter blur-xl opacity-70"></div>
                  <div className="absolute rounded-full bg-cyan-50/80 -bottom-16 opacity-70 -right-16 w-80 h-80 mix-blend-multiply filter blur-xl"></div>

                  <div className="relative bg-white rounded-md shadow dark:bg-zinc-800">
                    <div className="p-4 px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <svg className="w-auto h-16 dark:text-white text-zinc-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 305 280"><path fill="currentColor" d="M16.51 245.434h19.629c2.604 0 4.883-1.091 6.836-3.272 1.985-2.181 3.515-3.922 4.59-5.224.846-1.01 1.643-1.514 2.392-1.514 1.497 0 2.246.667 2.246 2.002 0 .488-.049.895-.146 1.22l-3.76 13.331H2.594c-1.498 0-2.246-.668-2.246-2.002 0-1.237.813-2.133 2.441-2.686 1.628-.586 2.441-1.725 2.441-3.418v-54.248c0-1.66-.813-2.783-2.44-3.369-1.629-.586-2.442-1.514-2.442-2.783 0-1.335.748-2.002 2.246-2.002h16.552c1.465 0 2.198.667 2.198 2.002 0 1.269-.814 2.197-2.442 2.783-1.627.586-2.441 1.709-2.441 3.369l.049 55.811ZM58.404 212.23c-.455-1.041-1.123-1.855-2.002-2.441-.748-.488-1.627-.928-2.636-1.318-1.01-.423-1.644-.993-1.905-1.709-.13-.293-.195-.554-.195-.782 0-.944.619-1.416 1.856-1.416h16.015c1.204 0 2.018.505 2.441 1.514.13.228.196.472.196.733 0 .748-.472 1.35-1.416 1.806-.456.228-.781.619-.977 1.172a2.163 2.163 0 0 0-.097.684c0 .293.081.602.244.927l11.62 28.418 10.06-24.121c.26-.586.39-1.155.39-1.709 0-.944-.39-1.871-1.172-2.783l-2.148-2.588 5.078-3.955c.39-.423.862-.635 1.416-.635.618 0 1.188.261 1.709.782l2.734 2.783c.716.748 1.074 1.66 1.074 2.734 0 .554-.113 1.188-.341 1.904-.521 1.563-1.302 3.402-2.344 5.518l-24.121 53.809c-1.01 2.148-1.904 3.955-2.686 5.42-1.009 1.757-2.376 2.636-4.101 2.636H66.9l-4.004-.146c-1.334-.228-2.002-.863-2.002-1.905l-.341-6.494 3.71-.097c1.66-.065 2.849-.814 3.565-2.246l7.617-15.821c.098 0 .147-.032.147-.097 0-.131-.114-.326-.342-.586-.195-.196-.374-.537-.537-1.026a31.719 31.719 0 0 0-.342-.927L58.404 212.23ZM140.68 248.266l-11.719 4.296c-1.204.424-2.23.635-3.076.635h-2.051c-5.013-.26-9.277-2.246-12.793-5.957-3.548-3.776-5.566-8.349-6.055-13.72a42.316 42.316 0 0 1-.195-4.004c0-1.726.114-3.402.342-5.03.423-2.897 1.546-5.778 3.369-8.642.879-1.53 2.409-3.125 4.59-4.785a16.222 16.222 0 0 1 2.685-1.465c2.637-.977 5.258-1.953 7.862-2.93l7.91-2.93c.716-.26 1.4-.39 2.051-.39h.293c2.213.097 4.882.651 8.007 1.66h.098c0-.033-.439-.261-1.318-.684v-14.697c0-1.66-.814-2.783-2.442-3.369-1.627-.586-2.441-1.514-2.441-2.783 0-1.335.732-2.002 2.197-2.002a29.992 29.992 0 0 0 6.055-.928c2.051-.553 4.687-1.367 7.91-2.441v65.771c0 1.693.814 2.832 2.441 3.418 1.628.553 2.442 1.449 2.442 2.686 0 1.334-.749 2.002-2.246 2.002H142.73c-1.367 0-2.05-.538-2.05-1.612v-2.099Zm0-34.522c-1.172-1.042-2.751-2.018-4.737-2.93-1.985-.944-3.711-1.448-5.175-1.513h-.147c-.456 0-.944.097-1.465.293-1.172.423-2.344.862-3.515 1.318-1.14.423-2.295.846-3.467 1.27-.619.26-1.107.586-1.465.976-1.888 2.018-3.158 4.476-3.809 7.373a28.506 28.506 0 0 0-.83 6.739c0 .683.033 1.399.098 2.148.358 4.525 1.579 8.187 3.662 10.986 2.018 2.832 4.525 4.655 7.52 5.469a11.856 11.856 0 0 0 4.443.439c.586-.065 1.318-.244 2.197-.537.749-.26 1.921-.683 3.516-1.269a356.169 356.169 0 0 1 3.174-1.221v-29.541ZM176.91 181.664c4.362 0 6.543 2.116 6.543 6.348 0 4.264-2.181 6.396-6.543 6.396s-6.543-2.132-6.543-6.396c0-4.232 2.181-6.348 6.543-6.348Zm5.615 62.207c0 1.693.814 2.832 2.442 3.418 1.627.553 2.441 1.449 2.441 2.686 0 1.334-.732 2.002-2.197 2.002h-16.553c-1.497 0-2.246-.668-2.246-2.002 0-1.237.814-2.133 2.442-2.686 1.627-.586 2.441-1.725 2.441-3.418v-31.25c0-1.628-.814-2.734-2.441-3.32-1.628-.586-2.442-1.514-2.442-2.783 0-1.335.733-2.002 2.197-2.002a27.987 27.987 0 0 0 6.055-.977c2.051-.553 4.671-1.367 7.861-2.441v42.773ZM228.863 248.266l-11.718 4.296c-1.205.424-2.23.635-3.077.635h-2.05c-5.013-.26-9.278-2.246-12.793-5.957-3.549-3.776-5.567-8.349-6.055-13.72a42.316 42.316 0 0 1-.195-4.004c0-1.726.114-3.402.341-5.03.424-2.897 1.547-5.778 3.37-8.642.878-1.53 2.408-3.125 4.589-4.785a16.193 16.193 0 0 1 2.686-1.465c2.637-.977 5.257-1.953 7.861-2.93l7.91-2.93c.717-.26 1.4-.39 2.051-.39h.293c2.214.097 4.883.651 8.008 1.66.326.098.521.179.586.244.651.26 1.481.553 2.49.879.261.098.505.146.733.146a.788.788 0 0 0 .488-.146c.618-.521 1.042-.944 1.269-1.27.424-.553.993-.83 1.709-.83.358 0 .684.065.977.196 1.204.423 1.807 1.041 1.807 1.855v37.793c0 1.693.813 2.832 2.441 3.418 1.628.553 2.441 1.449 2.441 2.686 0 1.334-.748 2.002-2.246 2.002h-11.865c-1.367 0-2.051-.538-2.051-1.612v-2.099Zm0-34.473c-1.041-.977-2.588-1.953-4.638-2.93-2.019-.976-3.776-1.497-5.274-1.562h-.146c-.456 0-.944.097-1.465.293a152.1 152.1 0 0 0-3.516 1.318c-1.139.423-2.295.846-3.467 1.27-.618.26-1.106.586-1.464.976-1.888 2.018-3.158 4.476-3.809 7.373a28.506 28.506 0 0 0-.83 6.739c0 .683.032 1.399.098 2.148.358 4.525 1.578 8.187 3.662 10.986 2.018 2.832 4.524 4.655 7.519 5.469a11.866 11.866 0 0 0 4.444.439c.585-.065 1.318-.244 2.197-.537.749-.26 1.92-.683 3.515-1.269a369.226 369.226 0 0 1 3.174-1.221v-29.492ZM266.51 207.787c.651-.228 1.66-.602 3.027-1.123 1.367-.521 2.669-.993 3.906-1.416a40.731 40.731 0 0 1 9.668-2.148c.456-.033.912-.049 1.368-.049 3.059 0 5.94 1.025 8.642 3.076 4.199 3.223 6.299 9.945 6.299 20.166v17.578c0 1.693.814 2.832 2.441 3.418 1.628.553 2.442 1.449 2.442 2.686 0 1.334-.733 2.002-2.198 2.002H290.24c-1.367 0-2.051-.538-2.051-1.612v-24.072c0-6.901-1.383-11.703-4.15-14.404-1.66-1.628-3.662-2.442-6.006-2.442-1.4 0-2.946.277-4.638.83-.717.261-1.628.603-2.735 1.026-1.074.39-2.018.748-2.832 1.074-.749.26-1.188.423-1.318.488v31.006c0 1.693.814 2.832 2.441 3.418 1.628.553 2.442 1.449 2.442 2.686 0 1.334-.733 2.002-2.198 2.002h-16.552c-1.498 0-2.247-.668-2.247-2.002 0-1.237.814-2.133 2.442-2.686 1.627-.586 2.441-1.725 2.441-3.418v-31.25c0-1.628-.814-2.734-2.441-3.32-1.628-.586-2.442-1.514-2.442-2.783 0-1.335.733-2.002 2.198-2.002a27.988 27.988 0 0 0 6.054-.977c2.051-.553 4.672-1.367 7.862-2.441v6.689Z"></path><path fill="currentColor" stroke="currentColor" stroke-width="4" d="m116.326 127.538.043-.083.035-.087 40.745-101.337 43.383 86.292c.741 1.562 1.032 2.785 1.032 3.715 0 .776-.18 1.443-.526 2.044-1.225 1.869-3.13 4.266-5.758 7.208l-.01.012-.011.012-3.421 3.955a4.001 4.001 0 0 0 .655 5.839l10.555 7.767c.786.65 1.757 1.125 2.883 1.125 1.365 0 2.586-.604 3.624-1.443l.08-.065.073-.073 8.13-8.088.018-.018.018-.019c2.067-2.166 3.126-4.789 3.126-7.772 0-1.653-.323-3.426-.917-5.297l-.008-.027-.01-.027c-1.614-4.63-3.984-10.102-7.092-16.403l-.003-.005-48.978-98.545-.003-.006c-.594-1.216-1.217-2.31-1.882-2.985-.825-.914-1.945-1.227-3-1.227H143.98c-1.188 0-2.362.436-3.154 1.513l-.048.065-.043.07c-.297.48-.733 1.425-1.265 2.651l-.012.026-.01.026a65.023 65.023 0 0 0-1.056 2.768l-37.758 101.925-.001.003c-2.537 6.787-4.46 11.455-5.778 14.078l-.018.036-.017.038c-1.063 2.349-2.742 4.25-5.1 5.716l-.007.004-.006.005a33.522 33.522 0 0 1-4.335 2.341c-1.56.621-2.886 1.274-3.93 1.973-.838.545-1.55 1.25-2.014 2.151-.216.42-.428.977-.428 1.615 0 .59.148 1.186.487 1.724.689 1.222 1.94 1.574 2.954 1.574h33.857c1.054 0 2.019-.341 2.858-.933a5.107 5.107 0 0 0 1.944-2.231l.041-.09.032-.093c.137-.397.212-.816.212-1.249 0-1.332-.808-2.452-1.57-3.264l-.108-.116-.125-.097a160.485 160.485 0 0 0-2.362-1.794c-.49-.404-.85-.928-1.077-1.633l-.024-.075-.031-.074a3.206 3.206 0 0 1-.26-1.235c0-.575.145-1.195.498-1.88Z"></path></svg>
                        <p className="ml-6">
                          Lydian has been so kind to provide LDN tokens to Arkadiko.<br />
                          Want to know more about Lydian?
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 border-t border-b border-gray-200 divide-y divide-gray-200 dark:border-zinc-600 dark:divide-zinc-600 bg-gray-50 dark:bg-zinc-700 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
                      <a href="https://www.lydian.xyz" target="_blank" className="px-6 py-5 text-sm font-medium text-center group">
                        <span className="text-gray-900 dark:text-zinc-100">
                          <LinkIcon className="inline w-5 h-5 mr-3" />
                        </span>
                        <span className="text-gray-600 group-hover:text-gray-700 dark:text-zinc-300 dark:group-hover:text-zinc-200">Website</span>
                      </a>

                      <a href="https://discord.gg/7V2hmB8HVq" target="_blank" className="px-6 py-5 text-sm font-medium text-center group">
                        <span className="text-gray-900 dark:text-zinc-100">
                          <svg fill="currentColor" viewBox="0 0 24 24" className="inline w-5 h-5 mr-3" aria-hidden="true"><path fill-rule="evenodd" d="M18.93 5.34a16.89 16.89 0 00-4.07-1.23c-.03 0-.05.01-.07.03-.17.3-.37.7-.5 1.01a15.72 15.72 0 00-4.57 0c-.14-.32-.34-.7-.52-1a.06.06 0 00-.06-.04 16.84 16.84 0 00-4.1 1.25A15.95 15.95 0 002.1 16.42a16.8 16.8 0 005 2.45c.02 0 .05 0 .06-.02.39-.51.73-1.05 1.02-1.61a.06.06 0 00-.03-.09c-.54-.2-1.06-.44-1.56-.72a.06.06 0 010-.1l.3-.24a.06.06 0 01.07 0 12.18 12.18 0 0010.05 0h.06l.32.24c.03.03.03.08-.01.1-.5.28-1.02.52-1.56.72a.06.06 0 00-.04.09c.3.56.65 1.1 1.03 1.6.01.03.04.04.07.03a16.75 16.75 0 005.02-2.49 15.85 15.85 0 00-2.98-11.04zM8.68 14.18c-.98 0-1.8-.88-1.8-1.95 0-1.08.8-1.95 1.8-1.95 1.01 0 1.82.88 1.8 1.95 0 1.07-.8 1.95-1.8 1.95zm6.65 0c-.99 0-1.8-.88-1.8-1.95 0-1.08.8-1.95 1.8-1.95s1.81.88 1.8 1.95c0 1.07-.8 1.95-1.8 1.95z" clip-rule="evenodd"></path></svg>
                        </span>
                        <span className="text-gray-600 group-hover:text-gray-700 dark:text-zinc-300 dark:group-hover:text-zinc-200">Discord</span>
                      </a>

                      <a href="https://twitter.com/Lydian_DAO" target="_blank" className="px-6 py-5 text-sm font-medium text-center group">
                        <span className="text-gray-900 dark:text-zinc-100">
                          <svg fill="currentColor" viewBox="0 0 24 24" className="inline w-5 h-5 mr-3" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                        </span>
                        <span className="text-gray-600 group-hover:text-gray-700 dark:text-zinc-300 dark:group-hover:text-zinc-200">Twitter</span>
                      </a>
                    </div>

                    <div className="p-4 px-4 py-5 mt-12 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-3 rounded-full bg-gradient-to-tr from-slate-600 to-slate-800">
                          <GiftIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                        <p className="ml-6">
                          DIKO stakers on <span className="font-semibold">block 47500</span> are able to claim their LDN tokens here.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 border-t border-b border-gray-200 divide-y divide-gray-200 dark:border-zinc-600 dark:divide-zinc-600 bg-gray-50 dark:bg-zinc-700 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
                      <div className="px-6 py-5">
                        <h2 className="text-xl font-headings">
                          stDIKO pool
                        </h2>
                        <p>
                          {isLoading ? (
                            <>
                              <Placeholder className="py-2" width={Placeholder.width.HALF} />
                              <Placeholder className="py-2" width={Placeholder.width.HALF} />
                            </>
                          ) : (
                            <>
                              <p className="mt-1 text-sm">
                                Claimable: {' '}
                                {microToReadable(claimAmount1).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })} wLDN
                              </p>
                              <button
                                type="button"
                                disabled={claimAmount1 === 0}
                                onClick={() => claim1()}
                                className="inline-flex px-4 py-2 mt-4 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                              >
                                Claim
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="px-6 py-5">
                        <h2 className="text-xl font-headings">
                          DIKO/USDA pool
                        </h2>
                        <p>
                          {isLoading ? (
                            <>
                              <Placeholder className="py-2" width={Placeholder.width.HALF} />
                              <Placeholder className="py-2" width={Placeholder.width.HALF} />
                            </>
                          ) : (
                            <>
                              <p className="mt-1 text-sm">
                                Claimable: {' '}
                                {microToReadable(claimAmount2).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })} wLDN
                              </p>
                              <button
                                type="button"
                                disabled={claimAmount2 === 0}
                                onClick={() => claim2()}
                                className="inline-flex px-4 py-2 mt-4 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                              >
                                Claim
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="px-6 py-5">
                        <h2 className="text-xl font-headings">
                          STX/DIKO pool
                        </h2>
                        <p>
                          {isLoading ? (
                            <>
                              <Placeholder className="py-2" width={Placeholder.width.HALF} />
                              <Placeholder className="py-2" width={Placeholder.width.HALF} />
                            </>
                          ) : (
                            <>
                              <p className="mt-1 text-sm">
                                Claimable: {' '}
                                {microToReadable(claimAmount3).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })} wLDN
                              </p>
                              <button
                                type="button"
                                disabled={claimAmount3 === 0}
                                onClick={() => claim3()}
                                className="inline-flex px-4 py-2 mt-4 text-sm font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:hover:bg-indigo-300 disabled:pointer-events-none"
                              >
                                Claim
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
