import { connectWebSocketClient } from '@stacks/blockchain-api-client';

const env = process.env.REACT_APP_NETWORK_ENV || 'testnet';

let websocketUrl = 'wss://api.hiro.so';
let coreApiUrl = 'https://api.hiro.so';
if (env.includes('mocknet')) {
  websocketUrl = `ws://localhost:${process.env.LOCAL_STACKS_API_PORT}`;
  coreApiUrl = `http://localhost:${process.env.LOCAL_STACKS_API_PORT}`;
  // coreApiUrl = 'https://dull-liger-41.loca.lt';
  // websocketUrl = 'wss://dull-liger-41.loca.lt';
} else if (env.includes('testnet')) {
  coreApiUrl = 'https://api.testnet.hiro.so';
  websocketUrl = 'wss://api.hiro.so';
} else if (env.includes('regtest')) {
  coreApiUrl = 'https://stacks-node-api.regtest.stacks.co';
  websocketUrl = 'wss://stacks-node-api.regtest.stacks.co';
}

export const initiateConnection = async (address: string, setState: any) => {
  const client = await connectWebSocketClient(websocketUrl);

  client.subscribeAddressTransactions(address, function (transactionInfo) {
    parseTransaction(transactionInfo, setState);
  });
};

const parseTransaction = (update: any, setState: any) => {
  if (update['tx_status'] == 'success') {
    setState(prevState => ({
      ...prevState,
      currentTxStatus: 'success',
      currentTxMessage: 'Transaction successful',
    }));
  } else if (
    update['tx_status'] == 'abort_by_response' ||
    update['tx_status'] == 'abort_by_post_condition'
  ) {
    console.log(update);
    const url = `${coreApiUrl}/extended/v1/tx/${update['tx_id']}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const error = errToHumanReadable(data['tx_result']['repr']);
        setState(prevState => ({
          ...prevState,
          currentTxStatus: 'error',
          currentTxMessage: error,
        }));
      });
  }
};

const errToHumanReadable = (err: string) => {
  console.log(err);
  const errId = err.split('(err')[1].replace(/ /g, '').replace(')', '');
  if (errId === 'none') {
    return 'An unknown error occurred. Please try again';
  }

  return errorMessages[errId] || errId;
};

const errorMessages = {
  u1: 'You do not have enough balance to make this transaction',
  u119: 'You tried minting too much debt. Try minting less.',
  u4401: 'Not Authorized',
  u414: 'Stacking still in progress - please withdraw later',
  u52: 'No liquidation required',
  u71: 'Slippage over tolerance. Try adjusting slippage manually to execute this swap',
};
