import { useMemo } from 'react';
import { useAgentThreads } from './useAgentThreads';
import { useInboxTasks } from './useInboxTasks';
import { INBOX_MOCK_DATA } from '@/data/inboxMockData';
import type { InboxItem, NarrativeStatus, SeverityLevel, InboxItemType } from '@/components/agentic/inbox/types';
import type { AgentThread } from '@/types/agentic';

const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true';

function mapThreadToInboxItem(thread: AgentThread): InboxItem {
  // Derive narrative status from thread status
  const narrativeStatus: NarrativeStatus = 
    thread.status === 'complete' ? 'Meta-Loop Validated' :
    thread.status === 'error' ? 'Needs Review' :
    'Pending Human Review';

  // Derive severity from activity count and status
  const severity: SeverityLevel = 
    thread.status === 'error' ? 'critical' :
    thread.activityCount > 20 ? 'high' :
    thread.activityCount > 10 ? 'medium' :
    'low';

  // Derive item type from metadata
  const itemType: InboxItemType = 
    thread.meta.policyId ? 'policy_snapshot' :
    thread.meta.decisionId ? 'tool_approval' :
    thread.meta.workflowId ? 'drift_alert' :
    'system_notice';

  // Check if read from localStorage
  const readItems = JSON.parse(localStorage.getItem('inbox_read_items') || '[]');
  const isRead = readItems.includes(thread.id);

  // Extract metadata badges
  const badges = [];
  if (thread.activityCount > 0) {
    badges.push({ icon: '💬', label: 'Activity', count: thread.activityCount });
  }
  if (Array.isArray(thread.participants) && thread.participants.length > 0) {
    badges.push({ icon: '👥', label: 'Participants', count: thread.participants.length });
  } else if ('participantCount' in thread && (thread as any).participantCount > 0) {
    badges.push({ icon: '👥', label: 'Participants', count: (thread as any).participantCount });
  }

  return {
    item_id: thread.id,
    title: thread.title,
    subtitle: `Thread started ${new Date(thread.lastActivityTime).toLocaleDateString()}`,
    participants: Array.isArray(thread.participants) ? thread.participants : [],
    narrative_status: narrativeStatus,
    last_updated_at: thread.lastActivityTime,
    is_read: isRead,
    severity,
    item_type: itemType,
    metadata_badges: badges,
  };
}

export function useInboxItems() {
  const { data: inboxTasks = [], isLoading: tasksLoading } = useInboxTasks();
  const { data: threads = [], isLoading: threadsLoading, error } = useAgentThreads();

  const items = useMemo(() => {
    if (isDemoMode) {
      return INBOX_MOCK_DATA;
    }

    // Prioritize inbox_tasks if available
    if (inboxTasks.length > 0) {
      return inboxTasks.map(mapInboxTaskToInboxItem);
    }

    // Fallback to agent threads
    return threads.map(mapThreadToInboxItem);
  }, [inboxTasks, threads]);

  return {
    items,
    isLoading: tasksLoading || threadsLoading,
    error,
  };
}

function mapInboxTaskToInboxItem(task: any): InboxItem {
  const badges = task.action_payload?.metadata_badges || [];

  // Map status to valid NarrativeStatus
  let narrativeStatus: NarrativeStatus = 'Pending Human Review';
  if (task.status === 'approved') narrativeStatus = 'Meta-Loop Validated';
  else if (task.status === 'rejected') narrativeStatus = 'Needs Review';

  return {
    item_id: task.id,
    title: task.title,
    subtitle: task.summary_html.replace(/<[^>]*>/g, ''), // Strip HTML
    participants: [],
    narrative_status: narrativeStatus,
    last_updated_at: task.created_at,
    is_read: task.is_read,
    severity: task.severity as SeverityLevel,
    item_type: task.task_type as InboxItemType,
    metadata_badges: badges
  };
}
