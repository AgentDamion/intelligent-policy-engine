import React, { useState } from 'react';
import UnifiedPlatform from './UnifiedPlatform';
import './UnifiedPlatformDemo.css';

const UnifiedPlatformDemo = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="unified-platform-demo">
      <div className="demo-controls">
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="demo-toggle-btn"
        >
          {isVisible ? 'Hide' : 'Show'} Unified Platform
        </button>
      </div>
      
      {isVisible && (
        <div className="demo-container">
          <UnifiedPlatform />
        </div>
      )}
    </div>
  );
};

export default UnifiedPlatformDemo; 