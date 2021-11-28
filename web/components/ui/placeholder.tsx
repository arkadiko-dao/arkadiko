import React from 'react';
import { classNames } from '@common/class-names';

enum Color {
  GRAY,
  INDIGO,
}

enum Width {
  THIRD,
  HALF,
  FULL,
}

type Props = {
  color?: Color;
  width?: Width;
  className?: string;
};

const colorMap: Record<Color, string> = {
  [Color.GRAY]: 'bg-gray-300',
  [Color.INDIGO]: 'bg-indigo-300',
};

const widthMap: Record<Width, string> = {
  [Width.THIRD]: 'w-1/3',
  [Width.HALF]: 'w-1/2',
  [Width.FULL]: 'w-full',
};

export function Placeholder({ className, color = Color.INDIGO, width = Width.FULL }: Props) {
  return (
    <div className={`flex flex-1 ${className}`}>
      <div
        className={classNames('py-1 animate-pulse h-2 rounded', colorMap[color], widthMap[width])}
      />
    </div>
  );
}

Placeholder.color = Color;
Placeholder.width = Width;
Placeholder.className = '';
