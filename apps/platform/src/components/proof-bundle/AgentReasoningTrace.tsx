import React, { useState } from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProofBundle } from '@/services/vera/proofBundleService';

interface AgentReasoningTraceProps {
  bundle: ProofBundle;
}

export const AgentReasoningTrace: React.FC<AgentReasoningTraceProps> = ({ bundle }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract agent info from trace context
  const traceContext = bundle.traceContext;
  const agentCount = traceContext?.traceIds?.length || 3; // Default to 3 if not available
  const processingTime = '847ms'; // Would come from trace data

  // Agent names (would come from trace data)
  const agents = [
    { name: 'Policy Matcher', contribution: 'Matched tool to policy registry' },
    { name: 'Risk Assessor', contribution: 'Evaluated risk level: High' },
    { name: 'Precedent Analyzer', contribution: 'Found 12 similar decisions' },
  ];

  return (
    <EdgeCard>
      <EdgeCardHeader
        className="cursor-pointer hover:bg-neutral-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-aicomplyr-yellow" />
            <div>
              <div className="section-label">Agent Reasoning Trace</div>
              <div className="text-sm font-semibold text-neutral-900">
                {agentCount} agents • {processingTime} processing
              </div>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </EdgeCardHeader>
      {isOpen && (
        <EdgeCardBody className="space-y-3 bg-neutral-50">
          {agents.map((agent, idx) => (
            <div key={idx} className="py-2 border-b border-neutral-200 last:border-0">
              <div className="font-semibold text-sm text-neutral-900">{agent.name}</div>
              <div className="text-xs text-neutral-600 mt-1">{agent.contribution}</div>
            </div>
          ))}
          {traceContext?.generationSpanId && (
            <div className="pt-2 border-t border-neutral-200">
              <div className="text-xs mono-id">Span ID: {traceContext.generationSpanId}</div>
            </div>
          )}
        </EdgeCardBody>
      )}
    </EdgeCard>
  );
};

