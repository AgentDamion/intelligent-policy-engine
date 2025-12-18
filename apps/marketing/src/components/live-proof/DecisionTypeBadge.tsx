import React from 'react';
import type { DecisionTypeBadgeProps } from '@/types/live-proof';

const DecisionTypeBadge: React.FC<DecisionTypeBadgeProps> = ({ type }) => {
  const colors = {
    approve: 'bg-green-100 text-green-800',
    flag: 'bg-yellow-100 text-yellow-800',
    modify: 'bg-blue-100 text-blue-800',
    escalate: 'bg-red-100 text-red-800'
  };

  // Handle undefined/null type gracefully
  const safeType = type || 'unknown';
  const displayText = safeType.toUpperCase();

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[safeType as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
      {displayText}
    </span>
  );
};

export default DecisionTypeBadge;