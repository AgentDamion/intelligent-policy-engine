import React from 'react';
import { RoleKey } from '../../types/auth';

export interface RoleChipProps {
  role: RoleKey;
  selected: boolean;
  onToggle: (role: RoleKey) => void;
  tooltip?: string;
}

const roleLabels: Record<RoleKey, string> = {
  admin: 'Admin',
  reviewer: 'Reviewer',
  partnerLead: 'Partner Lead',
};

export const RoleChip: React.FC<RoleChipProps> = ({
  role,
  selected,
  onToggle,
  tooltip,
}) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(role)}
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${
          selected
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
      role="checkbox"
      aria-checked={selected}
      aria-label={`${roleLabels[role]} role`}
      title={tooltip}
    >
      <span className="mr-1.5">
        {selected ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        )}
      </span>
      {roleLabels[role]}
    </button>
  );
};
