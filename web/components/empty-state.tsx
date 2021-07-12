import React from 'react';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({Icon, title, description}) => {
  return (
    <div className="flex justify-center mx-auto mt-12 w-full md:w-2/3">
      <div className="flow-root bg-gray-100 border-dotted border-2 border-gray-300 rounded-lg p-8">
        <div className="relative">
          <div>
            <div className="md:absolute flex items-center justify-center h-24 w-24 text-gray-600 transform -rotate-12 bg-gray-100 md:-top-12 md:-left-16 mx-auto mb-4 md:mb-0">
              <Icon className="h-16 w-16 text-gray-600" aria-hidden="true" />
            </div>
            <p className="md:ml-16 text-lg leading-6 font-medium text-gray-900">{title}</p>
          </div>
          {description ? (
            <p className="mt-2 md:ml-16 text-base text-gray-500">
              {description}
            </p>
          ) : (
            null
          )}
        </div>
      </div>
    </div>
  )
};


