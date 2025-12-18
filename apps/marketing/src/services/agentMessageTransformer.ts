import type { AgentActivity, TransformedMessage } from '@/types/agentic';

// Map agent names to display names
const getAgentDisplayName = (agent: string): string => {
  const nameMap: Record<string, string> = {
    'policy_agent': 'PolicyAgent',
    'evidence_agent': 'EvidenceAgent',
    'compliance_agent': 'ComplianceAgent',
    'audit_agent': 'AuditAgent',
    'proof_agent': 'ProofAgent',
    'risk_agent': 'RiskAgent',
    'cursor_ai': 'CursorAI',
  };
  return nameMap[agent] || agent.charAt(0).toUpperCase() + agent.slice(1);
};

// Get agent initial for avatar
const getAgentInitial = (agent: string): string => {
  const words = agent.split('_');
  if (words.length > 1) {
    return words.map(w => w[0].toUpperCase()).join('');
  }
  return agent.charAt(0).toUpperCase();
};

// Transform activity into conversation message
export const transformActivityToMessage = (activity: AgentActivity): TransformedMessage => {
  const agentName = getAgentDisplayName(activity.agent);
  const agentInitial = getAgentInitial(activity.agent);
  
  // Format timestamp
  const timestamp = new Date(activity.created_at);
  const time = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Extract message text from reasoning or action
  const details = activity.details || {};
  let text = details.reasoning || activity.action || 'Agent activity recorded';
  
  // Generate chips from metadata
  const chips: TransformedMessage['chips'] = [];
  
  if (details.metadata) {
    const meta = details.metadata;
    
    // Fact chips
    if (meta.pattern) {
      chips.push({ label: `Pattern: ${meta.pattern}`, kind: 'fact' });
    }
    if (meta.evidence_count) {
      chips.push({ label: `Evidence: ${meta.evidence_count} items`, kind: 'fact' });
    }
    if (meta.root_cause) {
      chips.push({ label: `Root cause: ${meta.root_cause}`, kind: 'fact' });
    }
    
    // Status chips
    if (meta.harmonization_status) {
      chips.push({ label: meta.harmonization_status, kind: 'status' });
    }
    if (meta.action_taken) {
      chips.push({ label: `Action: ${meta.action_taken}`, kind: 'status' });
    }
  }

  return {
    id: activity.id.toString(),
    agent: `${agentInitial} ${agentName}`,
    time,
    text,
    chips: chips.length > 0 ? chips : undefined,
  };
};

// Transform thread activities into sorted message list
export const transformThreadToMessages = (activities: AgentActivity[]): TransformedMessage[] => {
  return activities
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(transformActivityToMessage);
};
