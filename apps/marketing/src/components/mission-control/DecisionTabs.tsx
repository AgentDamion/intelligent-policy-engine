import React from 'react';
import { Button } from '@/components/ui/button';

type TabType = 'impact' | 'decisions' | 'seams';

interface DecisionTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts?: {
    all?: number;
    escalate?: number;
    block?: number;
  };
}

export const DecisionTabs = ({
  activeTab,
  onTabChange,
  counts = {}
}: DecisionTabsProps) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'impact', label: 'Impact' },
    { id: 'decisions', label: 'Decisions' },
    { id: 'seams', label: 'Seams' }
  ];

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-1 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-filters for Decisions tab */}
      {activeTab === 'decisions' && (
        <div className="px-6 py-3 flex items-center gap-2 bg-muted/30">
          <Button
            variant="default"
            size="sm"
            className="rounded-full text-xs"
          >
            All ({counts.all || 4})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs"
          >
            Escalate ({counts.escalate || 2})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs"
          >
            Block ({counts.block || 1})
          </Button>
        </div>
      )}
    </div>
  );
};

export default DecisionTabs;




