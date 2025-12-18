import React, { useState } from 'react';
import { manifestoContent } from '@/content/alternate4Manifesto';
import { trackEvent, Events } from '@/utils/analytics';

export const UngovernedSeam = () => {
  const { seamContent } = manifestoContent;
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleInteraction = () => {
    trackEvent(Events.SEAM_INTERACTION);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  return (
    <div 
      className="relative w-12 cursor-pointer z-10 group"
      onMouseEnter={() => {
        setIsHovered(true);
        handleInteraction();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleInteraction}
    >
      {/* Danger Zone Visual - Fractured Seam */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-manifesto-seam/30 to-black/20 animate-seam-pulse" />
      <div className="absolute inset-y-0 left-0 w-px bg-manifesto-seam/60" />
      <div className="absolute inset-y-0 right-0 w-px bg-manifesto-seam/60" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-manifesto-seam" />
      
      {/* Seam Label - Vertical Text */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 bg-white/95 px-2 py-3 rounded shadow-md group-hover:bg-manifesto-seam/10 transition-colors"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <span className="text-sm font-solution font-bold text-manifesto-seam tracking-wider">
          {seamContent.label}
        </span>
      </div>

      {/* Bridge Icon - Crosses on hover */}
      {isHovered && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bridge-cross z-30">
          <div className="w-12 h-12 rounded-full bg-manifesto-bridge flex items-center justify-center shadow-xl border-2 border-white">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-1/2 left-16 -translate-y-1/2 bg-manifesto-problem text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap shadow-xl animate-fade-in z-40">
          {seamContent.tooltip}
          <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-3 h-3 bg-manifesto-problem rotate-45" />
        </div>
      )}
    </div>
  );
};
