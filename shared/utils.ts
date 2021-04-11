import {
  broadcastTransaction,
  makeContractDeploy,
  StacksTransaction,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
  makeContractCall
} from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
require('dotenv').config();

import * as fs from "fs";
const fetch = require("node-fetch");

import { ADDR1, ADDR4, testnetKeyMap } from "./mocknet";

const env = process.env.NETWORK_ENV || 'mocknet'; // mocknet, testnet or mainnet
const mocknet = (env === 'mocknet');

const STACKS_CORE_API_URL =
  (env === 'mocknet') ? "http://localhost:3999" :
  (env === 'testnet') ? "https://stacks-node-api.testnet.stacks.co" :
  "https://stacks-node-api.mainnet.stacks.co";
export const network = (env === 'mainnet') ? new StacksMainnet() : new StacksTestnet();
network.coreApiUrl = STACKS_CORE_API_URL;

const keys =
  (env === 'mocknet') ? testnetKeyMap[ADDR1] :
  (env === 'testnet') ? JSON.parse(fs.readFileSync("../keychain_testnet.json").toString()).keyInfo :
  JSON.parse(fs.readFileSync("../keychain_mainnet.json").toString()).keyInfo;

export const secretKey = mocknet ? keys.secretKey : keys.privateKey;
export const contractAddress = keys.address;
const deployKey = mocknet ? testnetKeyMap[ADDR4] : keys;
export const deployContractAddress = deployKey.address;
export const secretDeployKey = mocknet ? deployKey.secretKey : keys.privateKey;

export async function handleTransaction(transaction: StacksTransaction) {
  const result = await broadcastTransaction(transaction, network);
  console.log(result);
  if ((result as TxBroadcastResultRejected).error) {
    if ((result as TxBroadcastResultRejected).reason === "ContractAlreadyExists") {
      console.log("already deployed");
      return "" as TxBroadcastResultOk;
    } else {
      throw new Error(
        `failed to handle transaction ${transaction.txid()}: ${JSON.stringify(
          result
        )}`
      );
    }
  }
  const processed = await processing(result as TxBroadcastResultOk);
  if (!processed) {
    throw new Error(
      `failed to process transaction ${transaction.txid}: transaction not found`
    );
  }
  console.log(processed, result);
  return result as TxBroadcastResultOk;
}

export async function callContractFunction(contractName: string, functionName: string, sender: any, args: any) {
  const txOptions = {
    contractAddress: deployContractAddress,
    contractName: contractName,
    functionName: functionName,
    functionArgs: args,
    senderKey: sender,
    network,
    postConditionMode: 0x01 // PostconditionMode.Allow
  };

  console.log('Sending transaction', contractName);
  const transaction = await makeContractCall(txOptions);
  console.log(transaction);

  return handleTransaction(transaction);
}

export async function deployContract(contractName: string, changeCode: (str: string) => string = unchanged) {
  let codeBody;
  if (env === 'mocknet') {
    codeBody = fs.readFileSync(`./contracts/${contractName}.clar`).toString();
  } else {
    codeBody = fs.readFileSync(`./clarity/contracts/${contractName}.clar`).toString();
  }
  var transaction = await makeContractDeploy({
    contractName,
    codeBody: changeCode(codeBody),
    senderKey: secretDeployKey,
    network,
  });
  console.log(`deploy contract ${contractName}`);
  return handleTransaction(transaction);
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processing(tx: String, count: number = 0): Promise<boolean> {
  return processingWithSidecar(tx, count);
}

async function processingWithSidecar(
  tx: String,
  count: number = 0
): Promise<boolean> {
  const url = `${STACKS_CORE_API_URL}/extended/v1/tx/${tx}`;
  var result = await fetch(url);
  var value = await result.json();
  console.log(count);
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`);
    console.log(value);
    return true;
  }
  if (value.tx_status === "pending") {
    console.log(value);
  } else if (count === 3) {
    console.log(value);
  }

  if (count > 20) {
    console.log("failed after 10 tries");
    console.log(value);
    return false;
  }

  if (mocknet) {
    await timeout(3000);
  } else {
    await timeout(120000);
  }
  return processing(tx, count + 1);
}

export function unchanged(codeBody: string) {
  return codeBody;
}
