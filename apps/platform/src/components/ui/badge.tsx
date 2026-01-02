import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'destructive'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-aicomplyr-black text-white',
    secondary: 'bg-neutral-200 text-neutral-800',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    outline: 'bg-transparent border border-neutral-300 text-neutral-700',
    destructive: 'bg-status-denied text-white'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
