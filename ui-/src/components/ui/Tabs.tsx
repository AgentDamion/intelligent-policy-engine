import React from 'react';

export interface Tab {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, value, onChange, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === value;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.key}-panel`}
              id={`${tab.key}-tab`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
