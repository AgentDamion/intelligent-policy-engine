import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'primary'
  | 'primary-yellow'
  | 'secondary'
  | 'secondary-light'
  | 'tertiary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-aicomplyr-black text-white hover:bg-neutral-800',
  'primary-yellow': 'bg-aicomplyr-yellow text-aicomplyr-black hover:bg-yellow-400',
  secondary:
    'bg-white text-aicomplyr-black border-2 border-aicomplyr-black hover:bg-aicomplyr-black hover:text-white',
  'secondary-light':
    'bg-white text-aicomplyr-black border border-neutral-300 hover:border-aicomplyr-black',
  tertiary: 'bg-transparent text-aicomplyr-black hover:underline px-2',
};

export const AICOMPLYRButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className,
  ...props
}) => (
  <button
    className={cn(
      'inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-all duration-150',
      variantStyles[variant],
      className
    )}
    {...props}
  >
    {children}
  </button>
);


