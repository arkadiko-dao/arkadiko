import React from 'react';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, description }) => {
  return (
    <div className="flex justify-center w-full mx-auto mt-12 md:w-2/3">
      <div className="flow-root p-8 bg-gray-100 border-2 border-gray-300 border-dotted rounded-lg dark:bg-zinc-900 dark:border-500">
        <div className="relative">
          <div>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-gray-600 transform bg-gray-100 dark:text-zinc-400 dark:bg-zinc-900 md:absolute -rotate-12 md:-top-12 md:-left-16 md:mb-0">
              <Icon className="w-12 h-12 text-gray-600 dark:text-zinc-400" aria-hidden="true" />
            </div>
            <p className="text-lg font-medium leading-6 text-gray-900 dark:text-zinc-100 md:ml-8">
              {title}
            </p>
          </div>
          {description ? (
            <p className="mt-2 text-base text-gray-500 dark:text-zinc-400 md:ml-8">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
