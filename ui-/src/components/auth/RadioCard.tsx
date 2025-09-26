import React from 'react';
import { OrgType } from '../../types/auth';

export interface RadioCardProps {
  value: OrgType;
  selected: boolean;
  onSelect: (value: OrgType) => void;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const RadioCard: React.FC<RadioCardProps> = ({
  value,
  selected,
  onSelect,
  title,
  subtitle,
  icon,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(value)}
      disabled={disabled}
      className={`
        relative w-full p-4 rounded-lg border-2 text-left transition-all
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${
          selected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
    >
      <div className="flex items-start">
        {icon && (
          <div className="flex-shrink-0 mr-3">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
            {title}
          </h4>
          <p className={`mt-1 text-sm ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
            {subtitle}
          </p>
        </div>
        <div className="flex-shrink-0 ml-3">
          <div
            className={`
              h-4 w-4 rounded-full border-2 flex items-center justify-center
              ${selected ? 'border-blue-500' : 'border-gray-300'}
            `}
          >
            {selected && (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
