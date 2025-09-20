import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  description?: string;
}

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  tabs: Tab[];
  className?: string;
}

export function Tabs({ value, onChange, tabs, className = '' }: TabsProps) {
  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = value === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {Icon && (
                <Icon className={cn(
                  'mr-2 h-4 w-4',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                )} />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}