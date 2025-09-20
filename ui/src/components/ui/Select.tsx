import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select an option',
  className = '',
  disabled = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 text-gray-500" />
            )}
            <span className={cn(
              'block truncate',
              selectedOption ? 'text-gray-900' : 'text-gray-500'
            )}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen ? 'rotate-180' : ''
          )} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
                  isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                    <span className="block truncate">{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}