import { Contracts } from "./constants";
import {
  StacksBlockMetadata,
  StacksChainUpdate,
  DevnetNetworkOrchestrator,
  StacksTransactionMetadata,
  getIsolatedNetworkConfigUsingNetworkId
} from "@hirosystems/stacks-devnet-js";
import { StacksNetwork } from "@stacks/network";
import {
  AnchorMode,
  broadcastTransaction,
  bufferCV,
  getNonce,
  makeContractCall,
  PostConditionMode,
  tupleCV,
  TxBroadcastResult,
  uintCV,
} from "@stacks/transactions";
import { Constants } from "./constants";

import { decodeBtcAddress } from "@stacks/stacking";
import { toBytes } from "@stacks/common";
import { expect } from "vitest";
const fetch = require("node-fetch");

interface Account {
  stxAddress: string;
  btcAddress: string;
  secretKey: string;
}

interface EpochTimeline {
  epoch_2_0: number;
  epoch_2_05: number;
  epoch_2_1: number;
  pox_2_activation: number;
}

const DEFAULT_EPOCH_TIMELINE = {
  epoch_2_0: Constants.DEVNET_DEFAULT_EPOCH_2_0,
  epoch_2_05: Constants.DEVNET_DEFAULT_EPOCH_2_05,
  epoch_2_1: Constants.DEVNET_DEFAULT_EPOCH_2_1,
  pox_2_activation: Constants.DEVNET_DEFAULT_POX_2_ACTIVATION,
};

const delay = () => new Promise((resolve) => setTimeout(resolve, 3000));

export function buildDevnetNetworkOrchestrator(
  networkId: number,
  timeline: EpochTimeline = DEFAULT_EPOCH_TIMELINE,
  logs = false
) {
  let uuid = Date.now();
  let working_dir = `/tmp/stacks-test-${uuid}-${networkId}`;
  let config = {
    logs,
    devnet: {
      name: `ephemeral-devnet-${uuid}`,
      bitcoin_controller_block_time: Constants.BITCOIN_BLOCK_TIME,
      epoch_2_0: timeline.epoch_2_0,
      epoch_2_05: timeline.epoch_2_05,
      epoch_2_1: timeline.epoch_2_1,
      pox_2_activation: timeline.pox_2_activation,
      bitcoin_controller_automining_disabled: false,
      working_dir,
      use_docker_gateway_routing: process.env.GITHUB_ACTIONS ? true : false,
    },
  };
  let consolidatedConfig = getIsolatedNetworkConfigUsingNetworkId(
    networkId,
    config
  );
  let orchestrator = new DevnetNetworkOrchestrator(consolidatedConfig, 2500);
  return orchestrator;
}

export const getBitcoinBlockHeight = (
  chainUpdate: StacksChainUpdate
): number => {
  let metadata = chainUpdate.new_blocks[0].block
    .metadata! as StacksBlockMetadata;
  return metadata.bitcoin_anchor_block_identifier.index;
};

export const waitForStacksTransaction = async (
  orchestrator: DevnetNetworkOrchestrator,
  txid: string
): Promise<[StacksBlockMetadata, StacksTransactionMetadata]> => {
  let { chainUpdate, transaction } =
    await orchestrator.waitForStacksBlockIncludingTransaction(txid);
  return [
    <StacksBlockMetadata>chainUpdate.new_blocks[0].block.metadata,
    <StacksTransactionMetadata>transaction.metadata,
  ];
};

export const getNetworkIdFromEnv = (): number => {
  console.log(process.env);
  let networkId = process.env.JEST_WORKER_ID
    ? parseInt(process.env.JEST_WORKER_ID!)
    : process.env.VITEST_WORKER_ID
    ? parseInt(process.env.VITEST_WORKER_ID!)
    : 1;
  return networkId;
};

export const getChainInfo = async (
  network: StacksNetwork,
  retry?: number
): Promise<any> => {
  let retryCountdown = retry ? retry : 20;
  if (retryCountdown == 0) return Promise.reject();
  try {
    let response = await fetch(network.getInfoUrl(), {});
    let info = await response.json();
    return info;
  } catch (e) {
    await delay();
    return await getChainInfo(network, retryCountdown - 1);
  }
};

export const getPoxInfo = async (
  network: StacksNetwork,
  retry?: number
): Promise<any> => {
  let retryCountdown = retry ? retry : 20;
  if (retryCountdown == 0) return Promise.reject();
  try {
    let response = await fetch(network.getPoxInfoUrl(), {});
    let poxInfo = await response.json();
    return poxInfo;
  } catch (e) {
    await delay();
    return await getPoxInfo(network, retryCountdown - 1);
  }
};

export const getAccount = async (
  network: StacksNetwork,
  address: string,
  retry?: number
): Promise<any> => {
  let retryCountdown = retry ? retry : 20;
  if (retryCountdown == 0) return Promise.reject();
  try {
    let response = await fetch(network.getAccountApiUrl(address), {});
    let payload: any = await response.json();
    return {
      balance: BigInt(payload.balance),
      locked: BigInt(payload.locked),
      unlock_height: payload.unlock_height,
      nonce: payload.nonce,
    };
  } catch (e) {
    await delay();
    return await getAccount(network, address, retryCountdown - 1);
  }
};

export const getBitcoinHeightOfNextRewardPhase = async (
  network: StacksNetwork,
  retry?: number
): Promise<number> => {
  let response = await getPoxInfo(network, retry);
  return response.next_cycle.reward_phase_start_block_height;
};

export const getBitcoinHeightOfNextPreparePhase = async (
  network: StacksNetwork,
  retry?: number
): Promise<number> => {
  let response = await getPoxInfo(network, retry);
  return response.next_cycle.prepare_phase_start_block_height;
};

export const waitForNextPreparePhase = async (
  network: StacksNetwork,
  orchestrator: DevnetNetworkOrchestrator,
  offset?: number
): Promise<StacksChainUpdate> => {
  var height = await getBitcoinHeightOfNextPreparePhase(network);
  if (offset) {
    height = height + offset;
  }
  return await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(
    height
  );
};

export const waitForRewardCycleId = async (
  network: StacksNetwork,
  orchestrator: DevnetNetworkOrchestrator,
  id: number,
  offset?: number
): Promise<StacksChainUpdate> => {
  let response = await getPoxInfo(network);
  let height =
    response.first_burnchain_block_height + id * response.reward_cycle_length;
  if (offset) {
    height = height + offset;
  }
  return await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(
    height
  );
};

export const waitForNextRewardPhase = async (
  network: StacksNetwork,
  orchestrator: DevnetNetworkOrchestrator,
  offset?: number
): Promise<StacksChainUpdate> => {
  var height = await getBitcoinHeightOfNextRewardPhase(network);
  if (offset) {
    height = height + offset;
  }
  return await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(
    height
  );
};

export const expectAccountToBe = async (
  network: StacksNetwork,
  address: string,
  account: number,
  locked: number
) => {
  let wallet = await getAccount(network, address);
  expect(wallet.balance).toBe(BigInt(account));
  expect(wallet.locked).toBe(BigInt(locked));
};

export const broadcastStackSTX = async (
  poxVersion: number,
  network: StacksNetwork,
  amount: number,
  account: Account,
  blockHeight: number,
  cycles: number,
  fee: number,
  nonce: number
): Promise<TxBroadcastResult> => {
  const { version, data } = decodeBtcAddress(account.btcAddress);
  // @ts-ignore
  const address = { version: bufferCV(toBytes(new Uint8Array([version.valueOf()]))), hashbytes: bufferCV(data) };

  const txOptions = {
    contractAddress: Contracts.POX_1.address,
    contractName: poxVersion == 1 ? Contracts.POX_1.name : Contracts.POX_2.name,
    functionName: "stack-stx",
    functionArgs: [
      uintCV(amount),
      tupleCV(address),
      uintCV(blockHeight),
      uintCV(cycles),
    ],
    fee,
    nonce,
    network,
    anchorMode: AnchorMode.OnChainOnly,
    postConditionMode: PostConditionMode.Allow,
    senderKey: account.secretKey,
  };
  // @ts-ignore
  const tx = await makeContractCall(txOptions);
  // Broadcast transaction to our Devnet stacks node
  const result = await broadcastTransaction(tx, network);
  return result;
};
