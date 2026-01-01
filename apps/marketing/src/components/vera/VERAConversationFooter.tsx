import React from 'react';

interface VERAConversationFooterProps {
  isOnline?: boolean;
  shadowModeActive?: boolean;
}

export const VERAConversationFooter = ({
  isOnline = true,
  shadowModeActive = true
}: VERAConversationFooterProps) => {
  return (
    <footer className="bg-muted/30 border-t border-border px-6 py-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span 
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
          />
          <span>{isOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
        </div>
        
        {shadowModeActive && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Shadow Mode Active</span>
          </div>
        )}
      </div>
    </footer>
  );
};

export default VERAConversationFooter;











