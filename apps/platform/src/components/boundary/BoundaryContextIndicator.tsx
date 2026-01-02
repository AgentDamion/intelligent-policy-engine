import React, { useState, useEffect } from 'react';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useUnifiedAuthContext, type ContextSwitchRequest } from '@/services/auth/unifiedAuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface BoundaryContextIndicatorProps {
  enterpriseName?: string;  // Optional for backward compatibility
  partnerName?: string;     // Optional for backward compatibility
}

/**
 * BoundaryContextIndicator
 * Visual seam showing the enterprise ⇄ partner boundary with governance context.
 * Edge-defined design system compliant.
 */
export const BoundaryContextIndicator: React.FC<BoundaryContextIndicatorProps> = ({
  enterpriseName: propEnterpriseName,
  partnerName: propPartnerName,
}) => {
  const { boundaryContext, currentWorkspace, loading: workspaceLoading } = useWorkspaceContext();
  const { currentEnterprise } = useEnterprise();
  const { currentContext, switchContext, isLoading: authLoading } = useUnifiedAuthContext();
  
  const [regulatoryFramework, setRegulatoryFramework] = useState<string>('FDA 21 CFR Part 11');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch regulatory framework
  useEffect(() => {
    const fetchFramework = async () => {
      if (!currentWorkspace?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('workspace_frameworks')
          .select('regulatory_frameworks(short_name)')
          .eq('workspace_id', currentWorkspace.id)
          .eq('enabled', true)
          .order('priority', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error && data?.regulatory_frameworks) {
          const framework = data.regulatory_frameworks as { short_name: string };
          setRegulatoryFramework(framework.short_name);
        }
      } catch (err) {
        console.error('[BoundaryContextIndicator] Error fetching regulatory framework:', err);
      }
    };
    
    fetchFramework();
  }, [currentWorkspace?.id]);

  // Use context data if available, otherwise fall back to props
  const enterpriseName = boundaryContext?.enterpriseName || propEnterpriseName || currentEnterprise?.name || 'Enterprise';
  const partnerName = boundaryContext?.partnerName || propPartnerName || 'Partner';
  
  // Don't show if no boundary context and no props provided
  const hasBoundary = !!(boundaryContext || (propEnterpriseName && propPartnerName));
  
  // Determine current context type (map 'agencySeat' to 'enterprise' for display)
  const currentContextType = currentContext?.contextType === 'partner' ? 'partner' : 'enterprise';
  
  // Loading state
  if (workspaceLoading || authLoading) {
    return <BoundaryLoadingState />;
  }
  
  // No boundary context
  if (!hasBoundary) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileBoundaryIndicator
        enterpriseName={enterpriseName}
        partnerName={partnerName}
        currentContext={currentContextType}
        regulatoryFramework={regulatoryFramework}
        boundaryContext={boundaryContext}
        onSwitchContext={switchContext}
        currentWorkspaceId={currentWorkspace?.id}
      />
    );
  }

  return (
    <DesktopBoundaryIndicator
      enterpriseName={enterpriseName}
      partnerName={partnerName}
      currentContext={currentContextType}
      regulatoryFramework={regulatoryFramework}
      boundaryContext={boundaryContext}
      onSwitchContext={switchContext}
      currentWorkspaceId={currentWorkspace?.id}
    />
  );
};

// =============================================================================
// Loading State
// =============================================================================

const BoundaryLoadingState: React.FC = () => (
  <div className="border-b-4 border-aicomplyr-yellow bg-white">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-4 h-4 border-2 border-aicomplyr-black border-t-transparent animate-spin" />
        <span className="text-xs font-mono font-bold text-aicomplyr-black uppercase tracking-wider">
          Loading boundary context
        </span>
      </div>
    </div>
  </div>
);

// =============================================================================
// Desktop Boundary Indicator
// =============================================================================

interface DesktopBoundaryIndicatorProps {
  enterpriseName: string;
  partnerName: string;
  currentContext: 'enterprise' | 'partner';
  regulatoryFramework: string;
  boundaryContext: { enterpriseId: string; partnerId?: string } | null;
  onSwitchContext: (request: ContextSwitchRequest) => Promise<any>;
  currentWorkspaceId?: string;
}

const DesktopBoundaryIndicator: React.FC<DesktopBoundaryIndicatorProps> = ({
  enterpriseName,
  partnerName,
  currentContext,
  regulatoryFramework,
  boundaryContext,
  onSwitchContext,
  currentWorkspaceId,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (newContext: 'enterprise' | 'partner') => {
    if (newContext === currentContext || isSwitching || !boundaryContext) return;
    
    setIsSwitching(true);
    try {
      const request: ContextSwitchRequest = {
        enterpriseId: boundaryContext.enterpriseId,
        workspaceId: currentWorkspaceId,
        contextType: newContext === 'partner' ? 'partner' : 'enterprise',
        partnerId: newContext === 'partner' ? boundaryContext.partnerId : undefined,
      };
      await onSwitchContext(request);
    } catch (err) {
      console.error('[BoundaryContextIndicator] Error switching context:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div 
      className="border-b-4 border-aicomplyr-yellow bg-white"
      role="region"
      aria-label="Enterprise-partner boundary governance context"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Enterprise side */}
            <BoundaryEntity 
              type="enterprise"
              name={enterpriseName}
              isActive={currentContext === 'enterprise'}
            />
            
            {/* Boundary visualization */}
            <BoundaryVisualizer />
            
            {/* Partner side */}
            <BoundaryEntity 
              type="partner"
              name={partnerName}
              isActive={currentContext === 'partner'}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-aicomplyr-black uppercase tracking-wider">
              {regulatoryFramework}
            </span>
            <ContextSwitcher 
              currentContext={currentContext}
              isSwitching={isSwitching}
              onSwitch={handleSwitch}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Mobile Boundary Indicator
// =============================================================================

interface MobileBoundaryIndicatorProps {
  enterpriseName: string;
  partnerName: string;
  currentContext: 'enterprise' | 'partner';
  regulatoryFramework: string;
  boundaryContext: { enterpriseId: string; partnerId?: string } | null;
  onSwitchContext: (request: ContextSwitchRequest) => Promise<any>;
  currentWorkspaceId?: string;
}

const MobileBoundaryIndicator: React.FC<MobileBoundaryIndicatorProps> = ({
  enterpriseName,
  partnerName,
  currentContext,
  regulatoryFramework,
  boundaryContext,
  onSwitchContext,
  currentWorkspaceId,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (newContext: 'enterprise' | 'partner') => {
    if (newContext === currentContext || isSwitching || !boundaryContext) return;
    
    setIsSwitching(true);
    try {
      const request: ContextSwitchRequest = {
        enterpriseId: boundaryContext.enterpriseId,
        workspaceId: currentWorkspaceId,
        contextType: newContext === 'partner' ? 'partner' : 'enterprise',
        partnerId: newContext === 'partner' ? boundaryContext.partnerId : undefined,
      };
      await onSwitchContext(request);
    } catch (err) {
      console.error('[BoundaryContextIndicator] Error switching context:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="border-b-4 border-aicomplyr-yellow bg-white">
      <div className="px-4 py-3">
        {/* Top row: Entity indicators */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className={cn(
            "w-8 h-8 border-2 border-aicomplyr-black flex items-center justify-center",
            currentContext === 'enterprise' ? 'bg-aicomplyr-black' : 'bg-white'
          )}>
            <span className={cn(
              "font-bold text-sm font-mono",
              currentContext === 'enterprise' ? 'text-white' : 'text-aicomplyr-black'
            )}>
              {enterpriseName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-aicomplyr-black" />
            <div className="w-2 h-2 bg-aicomplyr-yellow" />
            <div className="w-4 h-0.5 bg-aicomplyr-black" />
          </div>
          
          <div className={cn(
            "w-8 h-8 border-2 border-aicomplyr-black flex items-center justify-center",
            currentContext === 'partner' ? 'bg-white' : 'bg-neutral-100'
          )}>
            <span className={cn(
              "font-bold text-sm font-mono",
              currentContext === 'partner' ? 'text-aicomplyr-black' : 'text-neutral-400'
            )}>
              {partnerName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Bottom row: Context switcher + regulatory framework */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-aicomplyr-black uppercase">
            {regulatoryFramework}
          </span>
          <div className="flex items-center border-2 border-aicomplyr-black">
            <button
              onClick={() => handleSwitch('enterprise')}
              disabled={isSwitching}
              className={cn(
                "px-2 py-1 text-[10px] font-bold font-mono uppercase transition-colors",
                currentContext === 'enterprise'
                  ? 'bg-aicomplyr-black text-white'
                  : 'bg-white text-aicomplyr-black hover:bg-neutral-100'
              )}
            >
              ENT
            </button>
            <div className="w-0.5 h-4 bg-aicomplyr-black" />
            <button
              onClick={() => handleSwitch('partner')}
              disabled={isSwitching}
              className={cn(
                "px-2 py-1 text-[10px] font-bold font-mono uppercase transition-colors",
                currentContext === 'partner'
                  ? 'bg-aicomplyr-black text-white'
                  : 'bg-white text-aicomplyr-black hover:bg-neutral-100'
              )}
            >
              PTR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Boundary Entity Component
// =============================================================================

interface BoundaryEntityProps {
  type: 'enterprise' | 'partner';
  name: string;
  isActive: boolean;
}

const BoundaryEntity: React.FC<BoundaryEntityProps> = ({ type, name, isActive }) => {
  const isEnterprise = type === 'enterprise';
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className={cn(
          "w-8 h-8 border-2 border-aicomplyr-black flex items-center justify-center",
          isActive 
            ? (isEnterprise ? 'bg-aicomplyr-black' : 'bg-white') 
            : 'bg-neutral-100 border-neutral-300'
        )}
      >
        <span 
          className={cn(
            "font-bold text-sm uppercase font-mono",
            isActive 
              ? (isEnterprise ? 'text-white' : 'text-aicomplyr-black')
              : 'text-neutral-400'
          )}
        >
          {name.charAt(0)}
        </span>
      </div>
      <div className="hidden md:block">
        <div className={cn(
          "text-sm font-bold font-mono",
          isActive ? 'text-aicomplyr-black' : 'text-neutral-400'
        )}>
          {name}
        </div>
        <div className={cn(
          "text-xs font-mono uppercase tracking-wider mt-0.5",
          isActive ? 'text-neutral-600' : 'text-neutral-400'
        )}>
          {isEnterprise ? 'Enterprise' : 'Agency Partner'}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Boundary Visualizer Component
// =============================================================================

const BoundaryVisualizer: React.FC = () => (
  <div className="flex items-center gap-3 mx-4">
    {/* Connection line */}
    <div className="w-8 h-0.5 bg-aicomplyr-black" />
    
    {/* Boundary indicator */}
    <div className="flex items-center gap-2 px-4 py-2 border-l-4 border-aicomplyr-yellow bg-white border border-aicomplyr-black">
      <div className="w-1.5 h-1.5 bg-aicomplyr-yellow" />
      <span className="text-xs font-bold text-aicomplyr-black uppercase tracking-widest font-mono">
        Boundary
      </span>
      <div className="w-1.5 h-1.5 bg-aicomplyr-yellow" />
    </div>
    
    {/* Connection line */}
    <div className="w-8 h-0.5 bg-aicomplyr-black" />
  </div>
);

// =============================================================================
// Context Switcher Component
// =============================================================================

interface ContextSwitcherProps {
  currentContext: 'enterprise' | 'partner';
  isSwitching: boolean;
  onSwitch: (newContext: 'enterprise' | 'partner') => void;
}

const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  currentContext,
  isSwitching,
  onSwitch,
}) => {
  return (
    <div className="flex items-center border-2 border-aicomplyr-black bg-white">
      <button
        onClick={() => onSwitch('enterprise')}
        disabled={isSwitching}
        className={cn(
          "px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors",
          currentContext === 'enterprise'
            ? 'bg-aicomplyr-black text-white'
            : 'bg-white text-aicomplyr-black hover:bg-neutral-100'
        )}
      >
        Enterprise
      </button>
      <div className="w-0.5 h-6 bg-aicomplyr-black" />
      <button
        onClick={() => onSwitch('partner')}
        disabled={isSwitching}
        className={cn(
          "px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors",
          currentContext === 'partner'
            ? 'bg-aicomplyr-black text-white'
            : 'bg-white text-aicomplyr-black hover:bg-neutral-100'
        )}
      >
        Partner
      </button>
    </div>
  );
};

export default BoundaryContextIndicator;
