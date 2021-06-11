import { useContext, useEffect } from 'react';
import { AppContext } from '@common/context';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';

export const websocketTxUpdater = (redirectUri:string) => {
  const [state, setState] = useContext(AppContext);
  const env = process.env.REACT_APP_NETWORK_ENV || 'testnet';

  let websocketUrl = 'wss://stacks-node-api.mainnet.stacks.co';
  let coreApiUrl = 'https://stacks-node-api.mainnet.stacks.co';
  if (env.includes('mocknet')) {
    websocketUrl = 'ws://localhost:3999';
    coreApiUrl = 'http://localhost:3999';
    // coreApiUrl = 'https://dull-liger-41.loca.lt';
    // websocketUrl = 'wss://dull-liger-41.loca.lt';
  } else if (env.includes('testnet')) {
    coreApiUrl = 'https://stacks-node-api.testnet.stacks.co';
    websocketUrl = 'wss://stacks-node-api.testnet.stacks.co';
  } else if (env.includes('testnet')) {
    coreApiUrl = 'https://stacks-node-api.regtest.stacks.co';
    websocketUrl = 'wss://stacks-node-api.regtest.stacks.co';
  }

  useEffect(() => {
    const subscribe = async (txId:string) => {
      const client = await connectWebSocketClient(`${coreApiUrl}`);
      await client.subscribeTxUpdates(txId, update => {
        console.log('Got an update:', update);
        if (update['tx_status'] == 'success') {
          if (redirectUri) {
            window.location.pathname = redirectUri;
          } else {
            window.location.reload(true);
          }
        } else if (update['tx_status'] == 'abort_by_response' || update['tx_status'] == 'abort_by_post_condition') {
          let url = `${coreApiUrl}/extended/v1/tx/${txId}`;
          fetch(url).then(response => response.json()).then(data => {
            const error = errToHumanReadable(data['tx_result']['repr']);
            setState(prevState => ({
              ...prevState,
              currentTxStatus: 'error',
              currentTxMessage: error
            }));
          });
        }
      });
    };
    if (state.currentTxId) {
      setState(prevState => ({
        ...prevState,
        currentTxMessage: ''
      }));
      subscribe(state.currentTxId);
    }
  }, [state.currentTxId]);
};

const errToHumanReadable = (err: string) => {
  const errId = err.split("(err")[1].replace(/ /g, '').replace(')', '');
  if (errId === 'none') {
    return 'An unknown error occurred. Please try again';
  }

  return errorMessages[errId] || errId;
};

const errorMessages = {
  'u1': 'You do not have enough balance to make this transaction',
  'u119': 'You tried minting too much debt. Try minting less.',
  'u4401': 'Not Authorized',
  'u414': 'Stacking still in progress - please withdraw later',
  'u52': 'No liquidation required',
  'u71': 'Slippage over tolerance. Try adjusting slippage manually to execute this swap'
};
