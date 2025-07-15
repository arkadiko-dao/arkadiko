import { StacksNetwork } from '@stacks/network';
import {
  ClarityValue,
  PostConditionModeName,
  cvToHex,
  postConditionToHex,
} from '@stacks/transactions';
import { request } from '@stacks/connect';
import { resolveProvider } from './utils';

export type ContractCallOptions = {
  stxAddress: string;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: StacksNetwork;
  postConditionMode?: PostConditionModeName;
  postConditions?: any[];
};

export async function makeContractCall(
  options: ContractCallOptions,
  onComplete: (error?: any, txId?: any) => void
) {
  const provider = resolveProvider();

  if (provider?.isOkxWallet) {
    const transaction = {
      stxAddress: options.stxAddress,
      txType: 'contract_call',
      contractName: options.contractName,
      contractAddress: options.contractAddress,
      functionName: options.functionName,
      functionArgs: options.functionArgs.map(arg => cvToHex(arg)),
      postConditions: options.postConditions?.map(pc => postConditionToHex(pc)),
      postConditionMode: options.postConditionMode,
      anchorMode: 3,
    };
    const { txHash } = await provider.signTransaction(transaction);
    // console.log(txHash);
    txHash ? onComplete(null, txHash) : onComplete('contract call error...', null);
  } else {
    try {
      const response = await request(
        'stx_callContract',
        {
          contract: `${options.contractAddress}.${options.contractName}`,
          functionName: options.functionName,
          functionArgs: options.functionArgs,
          postConditions: options.postConditions,
          postConditionMode: options.postConditionMode,
          network: process.env.NEXT_PUBLIC_NETWORK_ENV
        }
      );

      response['txid'] ? onComplete(null, response['txid']) : onComplete('contract call error...', null);
    } catch (e) {
      console.log('request error', e);
    }
  }
}
