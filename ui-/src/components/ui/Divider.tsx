import React from 'react';

export interface DividerProps {
  text?: string;
  label?: string; // Support both text and label props
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ text, label, className = '' }) => {
  const dividerText = text || label;
  
  if (dividerText) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-500">{dividerText}</span>
        </div>
      </div>
    );
  }

  return <hr className={`border-t border-gray-300 ${className}`} />;
};
