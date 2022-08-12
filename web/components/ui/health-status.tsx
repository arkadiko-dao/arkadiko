import React from 'react';
import { classNames } from '@common/class-names';
import { StyledIcon } from './styled-icon';
import * as HeroiconsSolid from '@heroicons/react/solid';
type IconName = keyof typeof HeroiconsSolid;


enum StatusType {
  WARNING,
  ERROR,
  SUCCESS,
}

type StatusTypeConfig = {
  wrapperClass: string;
  icon: IconName;
};

type Props = {
  type?: StatusType;
  label: string;
  labelHover: string;
};

const configMap: Record<StatusType, StatusTypeConfig> = {
  [StatusType.WARNING]: {
    wrapperClass: 'bg-yellow-100 text-yellow-800',
    icon: 'ExclamationIcon',
  },
  [StatusType.ERROR]: {
    wrapperClass: 'bg-red-100 text-red-800',
    icon: 'ShieldExclamationIcon',
  },
  [StatusType.SUCCESS]: {
    wrapperClass: 'bg-green-100 text-green-800',
    icon: 'ShieldCheckIcon',
  },
};

export function Status({ type = StatusType.SUCCESS, label, labelHover }: Props) {
  const status = configMap[type];

  return (
    <span className={classNames('overflow-hidden group inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold h-6', status.wrapperClass)}>
      <StyledIcon as={status.icon} size={5} className="mr-2" />
      {label}
      <span className="flex items-center flex-shrink-0 invisible w-0 h-0 group-hover:w-full group-hover:visible group-hover:h-6">
        <svg
          className="w-1.5 h-1.5 mx-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 8 8"
        >
          <circle cx={4} cy={4} r={3} />
        </svg>
        <span className="flex-shrink-0">{labelHover}</span>
      </span>
    </span>
  );
}

Status.type = StatusType;
