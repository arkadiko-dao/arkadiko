import React from 'react';

interface PlaceHolderProps {
  size: number;
  color: string
}

export const PlaceHolder: React.FC<PlaceHolderProps> = ({size, color}) => {
  return (
    <div className="flex flex-1 animate-pulse">
      <div className={`flex-1 space-y-${size} py-1`}>
        <div className={`h-${size} bg-${color}-300 rounded w-3/4`}></div>
        <div className={`space-y-${size / 2}`}>
          <div className={`h-${size} bg-${color}-300 rounded`}></div>
          <div className={`h-${size} bg-${color}-300 rounded w-5/6`}></div>
        </div>
      </div>
    </div>
  )
};
