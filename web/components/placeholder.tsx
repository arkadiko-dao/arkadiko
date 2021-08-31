import React from 'react';
import { classNames } from '@common/class-names';

enum Color {
  GRAY,
  INDIGO
}

type Props = {
  color: Color;
};

const colorMap: Record<Color, string> = {
  [Color.GRAY]: "bg-gray-300",
  [Color.INDIGO]: "bg-indigo-300",
};

export const PlaceHolder = (props: Props)  => {
  const { color } = props;
  return (
    <div className="flex flex-1 animate-pulse">
      <div className="flex-1 py-1 space-y-2">
        <div className={classNames(
          "h-2 rounded w-3/4",
          colorMap[color])}
        >  
        </div>
        <div className="space-y-1">
          <div className={classNames(
            "h-2 rounded",
            colorMap[color])}
          ></div>
          <div className={classNames(
            "h-2 rounded w-5/6",
            colorMap[color])}
          ></div>
        </div>
      </div>
    </div>
  )
};

PlaceHolder.defaultProps = {
  color: Color.INDIGO
};
PlaceHolder.color = Color;
