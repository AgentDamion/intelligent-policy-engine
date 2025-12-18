import React from 'react';

const AicomplyrLogo = ({ height = 24, className = '', showFull = true, onClick }) => {
  const isMobile = height <= 20;
  const isTablet = height > 20 && height <= 28;
  
  return (
    <div 
      className={`flex items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{
        transition: 'transform 0.2s ease-in-out',
        transform: onClick ? 'hover:scale-105' : 'none'
      }}
    >
      <svg 
        width={isMobile ? 40 : height * 4} 
        height={height} 
        viewBox={isMobile ? "0 0 40 20" : "0 0 120 24"} 
        className="flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              .ai-text { fill: #14B8A6; font-family: 'Inter', sans-serif; font-weight: 600; }
              .complyr-text { fill: #0F172A; font-family: 'Inter', sans-serif; font-weight: 600; }
              .io-text { fill: #FF6B35; font-family: 'Inter', sans-serif; font-weight: 600; }
            `}
          </style>
        </defs>
        
        {isMobile ? (
          // Mobile: Show only "ai" in teal
          <text x="0" y="14" className="ai-text" fontSize="12" letterSpacing="0.5">
            ai
          </text>
        ) : (
          // Tablet and up: Show full logo
          <>
            {/* "ai" in teal */}
            <text x="0" y="18" className="ai-text" fontSize="16" letterSpacing="0.5">
              ai
            </text>
            
            {/* "complyr" in dark navy */}
            <text x="25" y="18" className="complyr-text" fontSize="16" letterSpacing="0.5">
              complr
            </text>
            
            {/* ".io" in orange */}
            <text x="85" y="18" className="io-text" fontSize="16" letterSpacing="0.5">
              .io
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export default AicomplyrLogo; 