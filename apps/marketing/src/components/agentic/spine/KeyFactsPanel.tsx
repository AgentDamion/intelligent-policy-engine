import { ACPill } from '@/components/agentic/ac/ACPill';
import { ACButton } from '@/components/agentic/ac/ACButton';
import type { SpineKeyFacts } from '@/types/spine';
import { SPINE_LAYOUT } from '@/constants/spine';

interface KeyFactsPanelProps {
  facts: SpineKeyFacts;
  onOpenProof: () => void;
  onViewWeave: () => void;
}

export const KeyFactsPanel = ({ facts, onOpenProof, onViewWeave }: KeyFactsPanelProps) => {
  return (
    <aside
      className="border-r border-ink-100 bg-surface-0 p-s4 flex flex-col gap-s4"
      style={{ width: `${SPINE_LAYOUT.LEFT_RAIL_WIDTH}px` }}
      aria-label="Key facts"
    >
      <div>
        <h1 className="text-[16px] font-semibold text-ink-900 mb-s2">
          {facts.caseTitle}
        </h1>
        <ACPill label={facts.state} kind="status" />
      </div>
      
      <div className="space-y-s3 font-mono text-[12px]">
        <div>
          <div className="text-ink-500">EPS ID</div>
          <div className="text-ink-900">{facts.policySnapshotId}</div>
        </div>
        <div>
          <div className="text-ink-500">Tool</div>
          <div className="text-ink-900">{facts.tool.name}@{facts.tool.version}</div>
        </div>
        <div>
          <div className="text-ink-500">Region</div>
          <div className="text-ink-900">{facts.region}</div>
        </div>
        <div>
          <div className="text-ink-500">Owner</div>
          <div className="text-ink-900 truncate">{facts.owner}</div>
        </div>
        <div>
          <div className="text-ink-500">Thread</div>
          <div className="text-ink-900">{facts.threadId}</div>
        </div>
      </div>
      
      <div className="mt-auto space-y-s2">
        <ACButton
          variant="secondary"
          className="w-full"
          onClick={onOpenProof}
        >
          Open Proof Bundle
        </ACButton>
        <ACButton
          variant="ghost"
          className="w-full text-ink-500 hover:text-ink-900"
          onClick={onViewWeave}
        >
          View Weave →
        </ACButton>
      </div>
    </aside>
  );
};
