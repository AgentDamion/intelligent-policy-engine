import { clsx } from 'clsx';

interface ACButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  'data-action'?: string;
}

export const ACButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled,
  className,
  'data-action': dataAction
}: ACButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-action={dataAction}
      className={clsx(
        'px-s3 py-s2 text-[14px] font-medium rounded-r1 outline-none transition-colors',
        'focus:shadow-focus-ring',
        {
          'bg-ink-900 text-white hover:bg-ink-800 disabled:bg-ink-300': variant === 'primary',
          'bg-white text-ink-900 border border-ink-200 hover:bg-surface-50': variant === 'secondary',
          'bg-transparent text-ink-700 hover:bg-surface-50': variant === 'ghost',
        },
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
};
