import { useContext, useEffect } from 'react';
import { AppContext } from '@common/context';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';

export const websocketTxUpdater = (redirectUri:string) => {
  const [state, setState] = useContext(AppContext);
  const env = process.env.REACT_APP_NETWORK_ENV || 'testnet';

  let coreApiUrl = 'stacks-node-api.mainnet.stacks.co';
  if (env.includes('mocknet')) {
    coreApiUrl = 'localhost:3999';
  } else if (env.includes('testnet')) {
    coreApiUrl = 'stacks-node-api.testnet.stacks.co';
  }

  useEffect(() => {
    const subscribe = async (txId:string) => {
      const client = await connectWebSocketClient(`ws://${coreApiUrl}`);
      await client.subscribeTxUpdates(txId, update => {
        console.log('Got an update:', update);
        if (update['tx_status'] == 'success') {
          if (redirectUri) {
            window.location.pathname = redirectUri;
          } else {
            window.location.reload(true);
          }
        } else if (update['tx_status'] == 'abort_by_response') {
          let url = `http://${coreApiUrl}/extended/v1/tx/${txId}`;
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
  'u4401': 'Not Authorized',
  'u414': 'Stacking still in progress - please withdraw later',
  'u52': 'No liquidation required'
};
