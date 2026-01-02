import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoClearedBannerProps {
  count: number;
  onShow?: () => void;
}

export const AutoClearedBanner = ({ count, onShow }: AutoClearedBannerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg mx-6 mb-4">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded) onShow?.();
        }}
        className="w-full flex items-center justify-between px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span>
            {count} decision{count !== 1 ? 's' : ''} I auto-cleared (for your awareness)
          </span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <span className="text-xs">Show</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-green-200 mt-2 pt-4">
          <div className="space-y-2 text-sm text-green-800">
            <p className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              CARDIOMAX Patient Guide - All tools approved, standard workflow
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              NEUROZEN Email Series - Pre-approved agency, certified tools
            </p>
            <p className="text-green-600 text-xs mt-4">
              These decisions met all policy requirements and were auto-cleared without human review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoClearedBanner;














