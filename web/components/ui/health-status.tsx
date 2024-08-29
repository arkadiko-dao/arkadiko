import React from 'react';
import { classNames } from '@common/class-names';
import { StyledIcon } from './styled-icon';
import * as HeroiconsSolid from '@heroicons/react/solid';
type IconName = keyof typeof HeroiconsSolid;


enum StatusType {
  WARNING,
  ERROR,
  SUCCESS,
  NEUTRAL
}

type StatusTypeConfig = {
  wrapperClass: string;
  icon?: IconName;
};

type Props = {
  type?: StatusType;
  label?: string;
  labelHover?: string;
  hasHover?: boolean;
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
  [StatusType.NEUTRAL]: {
    wrapperClass: 'bg-neutral-300/80 text-neutral-700',
  },
};

export const debtClassToType = (debtClass: string, redemptionPosition: number) => {
  if (debtClass.includes('green-500') && redemptionPosition > 5) {
    return StatusType.SUCCESS;
  } else if (debtClass.includes('red-600') || redemptionPosition <= 4) {
    return StatusType.ERROR;
  } else if (debtClass.includes('orange-500') || redemptionPosition <= 10) {
    return StatusType.WARNING;
  }

  return StatusType.NEUTRAL;
}

export const debtClassToLabel = (debtClass: string, redemptionPosition: number) => {
  if (debtClass.includes('green-500') && redemptionPosition > 5) {
    return 'Healthy';
  } else if (debtClass.includes('red-600') || redemptionPosition <= 4) {
    if (debtClass.includes('red-600')) {
      return 'Liquidation Close';
    } else {
      return 'Redemption Risk';
    }
  } else if (debtClass.includes('orange-500') || redemptionPosition <= 10) {
    if (debtClass.includes('orange-500')) {
      return 'Danger - Liquidation';
    } else {
      return 'Danger - Redemption';
    }
  }

  return 'Neutral';
}

export function Status({ type = StatusType.SUCCESS, label, labelHover, hasHover }: Props) {
  const status = configMap[type];

  return (
    <span className={classNames(`overflow-hidden group inline-flex items-center ${label ? 'px-3' : 'px-0.5'} py-0.5 rounded-full text-sm font-semibold h-6`, status.wrapperClass)}>
      {status.icon ?
        <StyledIcon as={status.icon} size={5} className={label ? 'mr-2' : ''} />
      :null}
      {label && label}
      {hasHover ? (
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
      ) : null}
    </span>
  );
}

Status.type = StatusType;
