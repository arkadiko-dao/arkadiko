import React from 'react';

interface Props {
  position?: string | undefined;
  reversed?: boolean;
  arrow?: string;
  label: string;
  link: string;
  block: number;
}

export function PoxTimelineIndicator({ position = '-left-1 top-11', reversed, arrow, label, link, block }: Props) {
  return (
    <div className={`absolute flex flex-col items-start justify-start whitespace-nowrap ${position}`}>
      <div className={`flex items-center ${reversed ? 'order-1' : ''} mt-1 text-gray-600 dark:text-gray-300`}>
        <svg className={`w-4 h-4 mr-1 ${arrow}`} viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 18h-6a3 3 0 0 1 -3 -3v-10l-4 4m8 0l-4 -4"></path>
        </svg>
        <div className="text-xs font-semibold">{label}</div>
      </div>
      <a href={link} target="_blank" rel="noopener noreferrer" className="font-normal hover:underline text-xs mt-0.5 ml-1 text-gray-500 dark:text-gray-200">#{block}</a>
    </div>
  )
};
