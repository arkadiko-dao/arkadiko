import React from 'react';

export const DefiLlama: React.FC = () => {
  return (
    <section className="mt-8">
      <header className="pb-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-end">
        <div>
          <h3 className="text-lg leading-6 text-gray-900 font-headings">DefiLlama</h3>
        </div>
      </header>
      <div className="mt-4">
        <div className="px-4 py-5 bg-white border border-gray-200 rounded-lg sm:p-6">
          <iframe
            width="100%"
            height="360px"
            src="https://defillama.com/chart/protocol/arkadiko?mcap=false&tokenPrice=false&tokenVolume=false&twitter=false&devMetrics=false&devCommits=false&tvl=true&theme=light"
            title="DefiLlama"
          ></iframe>
        </div>
      </div>
    </section>
  );
};
