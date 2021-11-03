import React, { ReactNode } from 'react';
import { classNames } from '@common/class-names';
import { InformationCircleIcon, ExclamationIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/solid';

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
}
  
type Props = {
  type?: AlertType;
  children: ReactNode;
  title?: string;
};

const configMap: Record<AlertType, AlertTypeConfig> = {
  [AlertType.WARNING]: {
    wrapperClass: "border-yellow-400 bg-yellow-50", 
    icon: <ExclamationIcon className="w-5 h-5 text-yellow-400" aria-hidden="true" />,
    titleClass: "text-yellow-800", 
    contentClass: "text-yellow-700"
  },
  [AlertType.ERROR]: {
    wrapperClass: "border-red-400 bg-red-50",
    icon: <XCircleIcon className="w-5 h-5 text-red-400" aria-hidden="true" />,
    titleClass: "text-red-800", 
    contentClass: "text-red-700"
  },
  [AlertType.SUCCESS]: {
    wrapperClass: "border-green-400 bg-green-50",
    icon: <CheckCircleIcon className="w-5 h-5 text-green-400" aria-hidden="true" />,
    titleClass: "text-green-800", 
    contentClass: "text-green-700"
  },
  [AlertType.INFO]: {
    wrapperClass: "border-blue-400 bg-blue-50",
    icon: <InformationCircleIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />,
    titleClass: "text-blue-800", 
    contentClass: "text-blue-700"
  },
};

export function Alert({children, type = AlertType.INFO, title}: Props) {
  const alert = configMap[type];
  
  return (
    <div className={classNames(
      "p-4 mb-6 border-l-4 rounded-tr-md rounded-br-md",
      alert.wrapperClass,
      )}>
    <div className="flex">
      <div className="flex-shrink-0">
        {alert.icon}
      </div>
      <div className="flex-1 ml-3">
        {title ? (
          <h3 className={classNames(
            "text-sm font-semibold",
            alert.titleClass,
          )}>
            {title}
          </h3>
        ) : null}
        <div className={classNames(
            `${title ? 'mt-2' : ''} text-sm`,
            alert.contentClass,
          )}>
          {children}
        </div>
      </div>
    </div>
  </div>
  )
};

Alert.type = AlertType;
