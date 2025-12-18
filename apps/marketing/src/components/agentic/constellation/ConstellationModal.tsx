import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConstellationData } from '@/hooks/useConstellationData';
import { TopThreeDrivers } from './TopThreeDrivers';

import { OverviewPanel } from './OverviewPanel';
import { AllFeaturesPanel } from './AllFeaturesPanel';
import { DecisionPathPanel } from './DecisionPathPanel';
import { ACButton } from '@/components/agentic/ac/ACButton';
import { Loader2 } from 'lucide-react';

interface ConstellationModalProps {
  threadId: string;
  policySnapshotId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ConstellationModal = ({
  threadId,
  policySnapshotId,
  isOpen,
  onClose
}: ConstellationModalProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(0);
  const mode = isExpanded ? 'expanded' : 'collapsed';
  
  const { data, isLoading, error } = useConstellationData(threadId, mode);

  // Keyboard navigation
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentPanel(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPanel(prev => Math.min(2, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Reset panel when toggling expanded state
  useEffect(() => {
    if (isExpanded) {
      setCurrentPanel(0);
    }
  }, [isExpanded]);

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[400px] h-[300px] p-s5">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-ink-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[400px] h-[300px] p-s5">
          <div className="flex flex-col items-center justify-center h-full gap-s3">
            <p className="text-sm text-ink-700">Unable to load explainability data</p>
            <ACButton onClick={onClose} variant="secondary">Close</ACButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Collapsed state (default)
  if (!isExpanded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[400px] max-h-[300px] p-s5 bg-white" data-constellation-modal>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-ink-900 flex items-center gap-s2">
              <span>⚡</span>
              <span>Constellation</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-s4" data-top-three-drivers>
            <TopThreeDrivers drivers={data.topThree} confidence={data.confidence} />
            
            <ACButton
              onClick={() => setIsExpanded(true)}
              variant="secondary"
              className="w-full"
            >
              View Full Details →
            </ACButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }


  // Expanded state
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[80vh] p-s6 max-w-none bg-white" data-constellation-modal>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-ink-900 flex items-center gap-s2">
            <span>⚡</span>
            <span>Constellation</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[calc(100%-4rem)]">
          <Tabs defaultValue="overview" className="flex flex-col h-full">
            <TabsList className="flex gap-s3 border-b border-ink-100 px-s4">
              <TabsTrigger value="overview" className="text-sm px-s2 py-s2 data-[state=active]:text-ink-900 text-ink-600 hover:text-ink-900">
                Overview
              </TabsTrigger>
              <TabsTrigger value="drivers" className="text-sm px-s2 py-s2 data-[state=active]:text-ink-900 text-ink-600 hover:text-ink-900">
                Drivers
              </TabsTrigger>
              <TabsTrigger value="path" className="text-sm px-s2 py-s2 data-[state=active]:text-ink-900 text-ink-600 hover:text-ink-900">
                Decision Path
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="overview" className="h-full overflow-auto p-s4">
                <OverviewPanel drivers={data.topThree} confidence={data.confidence} />
              </TabsContent>

              <TabsContent value="drivers" className="h-full overflow-auto p-s4">
                {'allFeatures' in data && Array.isArray(data.allFeatures) && data.allFeatures.length > 0 ? (
                  <AllFeaturesPanel features={data.allFeatures} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-ink-600">
                    No feature drivers available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="path" className="h-full overflow-auto p-s4">
                {'decisionPath' in data && Array.isArray(data.decisionPath) && data.decisionPath.length > 0 ? (
                  <DecisionPathPanel 
                    decisionPath={data.decisionPath} 
                    modelVersion={'modelVersion' in data ? data.modelVersion : undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-ink-600">
                    No decision path captured
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="border-t border-ink-100 mt-s3 pt-s4">
            <ACButton onClick={() => setIsExpanded(false)} variant="secondary" className="w-full">
              ← Back to Summary
            </ACButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
