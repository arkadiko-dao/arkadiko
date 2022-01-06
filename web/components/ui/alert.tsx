import React, { ReactNode } from 'react';
import { classNames } from '@common/class-names';
import {
  InformationCircleIcon,
  ExclamationIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/solid';

enum AlertType {
  WARNING,
  ERROR,
  SUCCESS,
  INFO,
}

type AlertTypeConfig = {
  wrapperClass: string;
  icon: ReactNode;
  titleClass: string;
  contentClass: string;
};

type Props = {
  type?: AlertType;
  children: ReactNode;
  title?: string;
};

const configMap: Record<AlertType, AlertTypeConfig> = {
  [AlertType.WARNING]: {
    wrapperClass: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-200',
    icon: <ExclamationIcon className="w-5 h-5 text-yellow-400 dark:text-yellow-600" aria-hidden="true" />,
    titleClass: 'text-yellow-800 dark:text-yellow-900',
    contentClass: 'text-yellow-700 dark:text-yellow-800',
  },
  [AlertType.ERROR]: {
    wrapperClass: 'border-red-400 bg-red-50 dark:bg-red-200',
    icon: <XCircleIcon className="w-5 h-5 text-red-400 dark:text-red-600" aria-hidden="true" />,
    titleClass: 'text-red-800 dark:text-red-900',
    contentClass: 'text-red-700 dark:text-red-800',
  },
  [AlertType.SUCCESS]: {
    wrapperClass: 'border-green-400 bg-green-50 dark:bg-green-200',
    icon: <CheckCircleIcon className="w-5 h-5 text-green-400 dark:text-green-600" aria-hidden="true" />,
    titleClass: 'text-green-800 dark:text-green-900',
    contentClass: 'text-green-700 dark:text-green-800',
  },
  [AlertType.INFO]: {
    wrapperClass: 'border-blue-400 bg-blue-50 dark:bg-blue-200',
    icon: <InformationCircleIcon className="w-5 h-5 text-blue-400 dark:text-blue-600" aria-hidden="true" />,
    titleClass: 'text-blue-800 dark:text-blue-900',
    contentClass: 'text-blue-700 dark:text-blue-800',
  },
};

export function Alert({ children, type = AlertType.INFO, title }: Props) {
  const alert = configMap[type];

  return (
    <div
      className={classNames('p-4 mb-6 border-l-4 rounded-tr-md rounded-br-md', alert.wrapperClass)}
    >
      <div className="flex">
        <div className="shrink-0">{alert.icon}</div>
        <div className="flex-1 ml-3">
          {title ? (
            <h3 className={classNames('text-sm font-semibold', alert.titleClass)}>{title}</h3>
          ) : null}
          <div className={classNames(`${title ? 'mt-2' : ''} text-sm`, alert.contentClass)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

Alert.type = AlertType;
