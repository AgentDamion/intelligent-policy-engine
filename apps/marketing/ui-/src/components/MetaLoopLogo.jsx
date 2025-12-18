import React from 'react';

const MetaLoopLogo = ({ height = 32, className = '', showText = true, onClick }) => {
  const isMobile = height <= 24;
  const isTablet = height > 24 && height <= 40;
  
  return (
    <div 
      className={`flex items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{
        transition: 'transform 0.2s ease-in-out',
        transform: onClick ? 'hover:scale-105' : 'none'
      }}
    >
      {/* Icon - always visible */}
      <svg 
        width={isMobile ? 20 : height} 
        height={isMobile ? 20 : height} 
        viewBox="0 0 32 32" 
        className="flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for faceted segments */}
          <linearGradient id="segment1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
          <linearGradient id="segment2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#6BCF7C" />
          </linearGradient>
          <linearGradient id="segment3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6BCF7C" />
            <stop offset="100%" stopColor="#4ECDC4" />
          </linearGradient>
          <linearGradient id="segment4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ECDC4" />
            <stop offset="100%" stopColor="#556DEE" />
          </linearGradient>
          <linearGradient id="segment5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#556DEE" />
            <stop offset="100%" stopColor="#4A90E2" />
          </linearGradient>
          <linearGradient id="segment6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A90E2" />
            <stop offset="100%" stopColor="#FFD93D" />
          </linearGradient>
          
          {/* Shadow filter for 3D effect */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        {/* Hexagonal loop with 12 faceted segments */}
        <g filter="url(#shadow)">
          {/* Segment 1 - Top */}
          <path 
            d="M16 4 L20 6 L20 10 L16 12 L12 10 L12 6 Z" 
            fill="url(#segment1)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 2 - Top Right */}
          <path 
            d="M20 6 L24 8 L24 12 L20 14 L16 12 L16 8 Z" 
            fill="url(#segment2)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 3 - Right Top */}
          <path 
            d="M24 8 L28 12 L28 16 L24 20 L20 18 L20 14 Z" 
            fill="url(#segment3)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 4 - Right Bottom */}
          <path 
            d="M28 12 L28 16 L24 20 L20 20 L20 16 L24 12 Z" 
            fill="url(#segment4)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 5 - Bottom Right */}
          <path 
            d="M24 20 L20 20 L16 22 L16 26 L20 28 L24 26 Z" 
            fill="url(#segment5)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 6 - Bottom */}
          <path 
            d="M20 20 L16 22 L12 20 L12 16 L16 14 L20 16 Z" 
            fill="url(#segment6)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 7 - Bottom Left */}
          <path 
            d="M16 22 L12 20 L8 16 L8 12 L12 8 L16 10 Z" 
            fill="url(#segment1)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 8 - Left Bottom */}
          <path 
            d="M12 20 L8 16 L4 12 L4 8 L8 4 L12 8 Z" 
            fill="url(#segment2)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 9 - Left Top */}
          <path 
            d="M8 16 L4 12 L4 8 L8 4 L12 6 L12 10 Z" 
            fill="url(#segment3)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 10 - Top Left */}
          <path 
            d="M12 6 L8 4 L12 2 L16 4 L16 8 L12 10 Z" 
            fill="url(#segment4)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 11 - Top Center */}
          <path 
            d="M16 4 L20 6 L20 10 L16 12 L12 10 L12 6 Z" 
            fill="url(#segment5)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          
          {/* Segment 12 - Center */}
          <path 
            d="M16 12 L20 14 L20 18 L16 20 L12 18 L12 14 Z" 
            fill="url(#segment6)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
        </g>
      </svg>
      
      {/* Text - only show on tablet and up */}
      {showText && !isMobile && (
        <span 
          className="ml-3 font-bold text-gray-900 hidden sm:block"
          style={{ 
            fontSize: isTablet ? '14px' : '16px',
            lineHeight: '1.2'
          }}
        >
          MetaLoop
        </span>
      )}
    </div>
  );
};

export default MetaLoopLogo; 