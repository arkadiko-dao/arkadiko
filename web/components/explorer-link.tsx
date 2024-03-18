import React from 'react';
interface ExplorerLinkProps {
  txId: string;
  text?: string;
  skipConfirmCheck?: boolean;
  className?: string;
}

export const ExplorerLink: React.FC<ExplorerLinkProps> = ({ txId, text, className }) => {
  const env = process.env.REACT_APP_NETWORK_ENV;
  let url = '#';
  if (txId) {
    let id = txId.replace('"', '');
    if (!id.startsWith('0x') && !id.includes('.')) {
      id = `0x${id}`;
    }
    url = location.origin.includes('localhost')
      ? `http://localhost:3999/extended/v1/tx/${id}`
      : `https://explorer.hiro.so/txid/${id}`;
    if (env === 'testnet') url += '?chain=testnet';
  }

  return (
    <a className={className} href={url} target="_blank">
      {text || 'View transaction in explorer'}
    </a>
  );
};
