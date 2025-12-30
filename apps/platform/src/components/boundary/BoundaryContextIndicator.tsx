import React from 'react';
import { Zap } from 'lucide-react';

interface BoundaryContextIndicatorProps {
  enterpriseName?: string;
  partnerName?: string;
  label?: string;
}

/**
 * BoundaryContextIndicator
 * Visual seam showing the enterprise ⇄ partner boundary.
 */
export const BoundaryContextIndicator: React.FC<BoundaryContextIndicatorProps> = ({
  enterpriseName,
  partnerName,
  label = 'Boundary Governed',
}) => {
  if (!enterpriseName || !partnerName) return null;

  return (
    <div className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border-t-4 border-aicomplyr-yellow">
      <div className="w-1.5 h-1.5 bg-aicomplyr-yellow mr-2" />
      <div className="flex items-center gap-2">
        <span className="font-display text-sm text-aicomplyr-black">
          {enterpriseName}
        </span>
        <span className="text-amber-700 font-semibold">⇄</span>
        <span className="font-display text-sm text-aicomplyr-black">
          {partnerName}
        </span>
      </div>
      <div className="ml-4 flex items-center gap-1 text-sm text-amber-800 font-medium">
        <Zap className="w-4 h-4" />
        <span>{label}</span>
      </div>
    </div>
  );
};

export default BoundaryContextIndicator;

