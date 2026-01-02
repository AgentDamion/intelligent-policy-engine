import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'primary-yellow' | 'secondary' | 'secondary-light' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-aicomplyr-black text-white hover:bg-neutral-800',
    'primary-yellow': 'bg-aicomplyr-yellow text-aicomplyr-black hover:bg-[#E6CF00]',
    secondary: 'bg-white text-aicomplyr-black border-2 border-aicomplyr-black hover:bg-aicomplyr-black hover:text-white',
    'secondary-light': 'bg-white text-aicomplyr-black border border-neutral-300 hover:border-aicomplyr-black',
    outline: 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
    danger: 'bg-status-denied text-white hover:bg-red-700'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-colors duration-150 rounded-none
        focus:outline-none focus:ring-2 focus:ring-aicomplyr-black focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
