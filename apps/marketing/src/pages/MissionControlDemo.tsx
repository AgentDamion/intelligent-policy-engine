import React, { useState, useEffect } from 'react';
import { MissionControlHeader } from '@/components/mission-control/MissionControlHeader';
import { DecisionTabs } from '@/components/mission-control/DecisionTabs';
import { DecisionCard } from '@/components/mission-control/DecisionCard';
import { AutoClearedBanner } from '@/components/mission-control/AutoClearedBanner';
import { mockDecisions, missionControlStats } from '@/data/mockDecisions';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TabType = 'impact' | 'decisions' | 'seams';

const MissionControlDemo = () => {
  const [activeTab, setActiveTab] = useState<TabType>('decisions');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    document.title = 'VERA Mission Control | AIComplyr';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Enterprise AI governance dashboard. See VERA\'s real-time decisions, escalations, and proof bundles across your partner network.'
      );
    }
  }, []);

  const handleApprove = (id: string) => {
    toast.success(`Decision ${id} approved`);
  };

  const handleOverride = (id: string) => {
    toast.info(`Override requested for ${id}`);
  };

  const handleAskVera = (id: string) => {
    toast.info('Opening VERA chat...');
  };

  // Filter decisions that need attention (exclude ALLOW)
  const decisionsNeedingAttention = mockDecisions.filter(
    d => d.recommendation !== 'ALLOW'
  );

  // Count by type
  const counts = {
    all: decisionsNeedingAttention.length,
    escalate: decisionsNeedingAttention.filter(d => d.recommendation === 'ESCALATE').length,
    block: decisionsNeedingAttention.filter(d => d.recommendation === 'BLOCK').length
  };

  // Auto-cleared count
  const autoClearedCount = mockDecisions.filter(d => d.recommendation === 'ALLOW').length;

  // Sort decisions
  const sortedDecisions = [...decisionsNeedingAttention].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <MissionControlHeader
        enterprise={missionControlStats.enterprise}
        autoClearRate={missionControlStats.autoClearRate}
        decisionsNeedingAttention={missionControlStats.decisionsNeedingAttention}
        shadowMode={true}
      />

      <DecisionTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      <main className="py-6">
        {activeTab === 'decisions' && (
          <>
            {/* Header Row */}
            <div className="px-6 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">V</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Here are {counts.all} decisions I need your input on
                  </p>
                  <p className="text-xs text-muted-foreground">
                    I've auto-cleared low-risk submissions. These are the ones that need a human call.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Shadow Mode • Simulated decisions only</span>
                <div className="flex items-center gap-2">
                  <span>Sort:</span>
                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Decision Cards */}
            <div className="px-6 space-y-4">
              {sortedDecisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onApprove={handleApprove}
                  onOverride={handleOverride}
                  onAskVera={handleAskVera}
                />
              ))}
            </div>

            {/* Auto-cleared Banner */}
            <div className="mt-6">
              <AutoClearedBanner count={autoClearedCount} />
            </div>
          </>
        )}

        {activeTab === 'impact' && (
          <div className="px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Impact Dashboard</h2>
            <p className="text-muted-foreground">
              Analytics and impact metrics coming soon.
            </p>
          </div>
        )}

        {activeTab === 'seams' && (
          <div className="px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Governance Seams</h2>
            <p className="text-muted-foreground">
              Policy gaps and seam detection coming soon.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MissionControlDemo;



