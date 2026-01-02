import React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  className,
  ...props
}) => {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'w-5 h-5 min-w-[20px] border-2 flex items-center justify-center mt-0.5 transition-all',
          checked
            ? 'border-aicomplyr-black bg-aicomplyr-black'
            : 'border-neutral-400 bg-white'
        )}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="square"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-sm text-aicomplyr-black leading-relaxed flex-1 font-medium">
          {label}
        </span>
      )}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        {...props}
      />
    </label>
  );
};

