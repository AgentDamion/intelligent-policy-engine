import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InboxFilters } from './InboxFilters';
import { InboxList } from './InboxList';
import { InboxTaskDetail } from './InboxTaskDetail';
import { useInboxTasks } from '@/hooks/useInboxTasks';
import { useAgentThreads } from '@/hooks/useAgentThreads';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { monitoring } from '@/utils/monitoring';
import type { QuickViewFilter, StatusFilter, SeverityLevel, TimeFilter, InboxItem } from './types';

export const InboxView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedItemId = searchParams.get('item') || undefined;
  const threadId = searchParams.get('t') || 't1';
  
  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: threads = [] } = useAgentThreads();
  const { realtimeMessages, isTyping } = useAgentMessagesRealtime(threadId);

  // Filter state
  const [quickView, setQuickView] = useState<QuickViewFilter>('all');
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>(['open', 'in_review']);
  const [severityFilters, setSeverityFilters] = useState<SeverityLevel[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('last_7_days');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'most_recent' | 'oldest' | 'priority'>('most_recent');

  // Fetch inbox tasks from database
  const { data: tasks = [], isLoading } = useInboxTasks();
  
  // Map InboxTask to InboxItem for compatibility with existing UI
  const allItems = useMemo(() => {
    return tasks.map(task => ({
      item_id: task.id,
      title: task.title,
      subtitle: `From ${task.source_agent} • ${new Date(task.created_at).toLocaleDateString()}`,
      participants: [], // Could extract from context_data if needed
      narrative_status: task.status === 'pending' ? 'Pending Human Review' as const :
                        task.status === 'approved' ? 'Approved' as const : 
                        'Needs Review' as const,
      last_updated_at: task.updated_at,
      is_read: task.is_read,
      severity: task.severity,
      item_type: task.task_type as any,
      metadata_badges: [
        { icon: '🎯', label: task.priority.toUpperCase() },
        { icon: '👤', label: task.user_role_target }
      ]
    } as InboxItem));
  }, [tasks]);

  // Filter logic
  const filteredItems = useMemo(() => {
    let filtered = [...allItems];

    // Quick view filter
    if (quickView !== 'all') {
      filtered = filtered.filter(item => {
        if (quickView === 'reviews') return item.item_type === 'pcp_review' || item.item_type === 'evidence_review';
        if (quickView === 'approvals') return item.item_type === 'tool_approval';
        if (quickView === 'alerts') return item.item_type === 'drift_alert';
        if (quickView === 'proofs') return item.item_type === 'proof_incomplete';
        if (quickView === 'system') return item.item_type === 'system_notice';
        return true;
      });
    }

    // Status filter (map narrative status to status filters)
    if (statusFilters.length > 0) {
      filtered = filtered.filter(item => {
        const status = item.narrative_status;
        if (statusFilters.includes('open')) {
          if (status === 'Needs Review' || status === 'Pending Human Review') return true;
        }
        if (statusFilters.includes('in_review')) {
          if (status === 'In Review' || status === 'Under Investigation') return true;
        }
        if (statusFilters.includes('resolved')) {
          if (status === 'Meta-Loop Validated' || status === 'Human Verified' || status === 'Approved') return true;
        }
        return false;
      });
    }

    // Severity filter
    if (severityFilters.length > 0) {
      filtered = filtered.filter(item => severityFilters.includes(item.severity));
    }

    // Time filter
    const now = Date.now();
    if (timeFilter === 'today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => new Date(item.last_updated_at).getTime() >= startOfDay);
    } else if (timeFilter === 'last_7_days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(item => new Date(item.last_updated_at).getTime() >= sevenDaysAgo);
    } else if (timeFilter === 'last_30_days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(item => new Date(item.last_updated_at).getTime() >= thirtyDaysAgo);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.participants.some(p => p.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === 'most_recent') {
      filtered.sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.last_updated_at).getTime() - new Date(b.last_updated_at).getTime());
    } else if (sortBy === 'priority') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }

    return filtered;
  }, [allItems, quickView, statusFilters, severityFilters, timeFilter, searchQuery, sortBy]);

  // Calculate item counts for quick views
  const itemCounts: Record<QuickViewFilter, number> = useMemo(() => {
    const counts: Record<QuickViewFilter, number> = {
      all: allItems.length,
      reviews: 0,
      approvals: 0,
      alerts: 0,
      proofs: 0,
      system: 0,
    };

    allItems.forEach(item => {
      if (item.item_type === 'pcp_review' || item.item_type === 'evidence_review') counts.reviews++;
      if (item.item_type === 'tool_approval') counts.approvals++;
      if (item.item_type === 'drift_alert') counts.alerts++;
      if (item.item_type === 'proof_incomplete') counts.proofs++;
      if (item.item_type === 'system_notice') counts.system++;
    });

    return counts;
  }, [allItems]);

  const handleItemSelect = (itemId: string) => {
    setSearchParams({ tab: 'inbox', item: itemId });
  };

  const handleStatusToggle = (status: StatusFilter) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSeverityToggle = (severity: SeverityLevel) => {
    setSeverityFilters(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const handleAgentQuery = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const query = inputValue;
    setInputValue('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user?.id || '')
        .limit(1)
        .single();

      const { error: functionError } = await supabase.functions.invoke(
        'cursor-agent-adapter',
        {
          body: {
            query,
            context: {
              threadId,
              workspaceId: workspaceMember?.workspace_id,
              mode: 'inbox-chat'
            }
          }
        }
      );

      if (functionError) throw functionError;

      monitoring.info('Agent query sent from inbox', {
        threadId,
        queryLength: query.length
      });
    } catch (err) {
      console.error('Failed to send query:', err);
      toast.error('Failed to send message to agents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgentQuery();
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Left Sidebar - Filters + Chat */}
      <div className="w-[240px] flex-shrink-0 border-r border-ink-100 bg-surface-0 flex flex-col">
        {/* Filters - scrollable */}
        <div className="flex-1 overflow-y-auto p-s4">
          <div className="mb-s6">
            <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
              Quick Views
            </h3>
            <div className="grid grid-cols-2 gap-s2">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'reviews' as const, label: 'Reviews' },
                { id: 'approvals' as const, label: 'Approvals' },
                { id: 'alerts' as const, label: 'Alerts' },
                { id: 'proofs' as const, label: 'Proofs' },
                { id: 'system' as const, label: 'System' },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setQuickView(view.id)}
                  className={`px-s3 py-s2 text-[12px] font-medium rounded-r1 border transition-colors text-left ${
                    quickView === view.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-white text-ink-700 border-ink-200 hover:bg-surface-50'
                  }`}
                >
                  <div>{view.label}</div>
                  <div className={`text-[11px] font-mono ${quickView === view.id ? 'text-primary-foreground/80' : 'text-ink-400'}`}>
                    {itemCounts[view.id] || 0}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-s6">
            <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
              Status
            </h3>
            <div className="space-y-s2">
              {[
                { id: 'open' as const, label: 'Open' },
                { id: 'in_review' as const, label: 'In Review' },
                { id: 'blocked' as const, label: 'Blocked' },
                { id: 'resolved' as const, label: 'Resolved' },
              ].map((status) => (
                <label
                  key={status.id}
                  className="flex items-center gap-s2 cursor-pointer hover:bg-surface-50 px-s2 py-s1 rounded-r1 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(status.id)}
                    onChange={() => handleStatusToggle(status.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[13px] text-ink-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-s6">
            <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
              Severity
            </h3>
            <div className="space-y-s2">
              {[
                { id: 'low' as const, label: 'Low' },
                { id: 'medium' as const, label: 'Medium' },
                { id: 'high' as const, label: 'High' },
                { id: 'critical' as const, label: 'Critical' },
              ].map((severity) => (
                <label
                  key={severity.id}
                  className="flex items-center gap-s2 cursor-pointer hover:bg-surface-50 px-s2 py-s1 rounded-r1 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={severityFilters.includes(severity.id)}
                    onChange={() => handleSeverityToggle(severity.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-[13px] text-ink-700">{severity.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Input - fixed at bottom */}
        <div className="border-t border-ink-100 p-s3 bg-surface-50">
          <div className="mb-s2">
            <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide">
              Agent Chat
            </div>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask agents..."
            disabled={isSubmitting}
            className="w-full px-s3 py-s2 text-[14px] rounded-r1 border border-ink-200 bg-surface-0 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Center Panel - Thread List */}
      <InboxList
        items={filteredItems}
        selectedItemId={selectedItemId}
        onItemSelect={handleItemSelect}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Right Panel - Detail View */}
      <div className="flex-1 bg-surface-0 border-l border-ink-100">
        {selectedItemId ? (
          <InboxTaskDetail taskId={selectedItemId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[14px] text-ink-500">Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
