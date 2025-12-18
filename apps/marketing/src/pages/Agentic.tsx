import { useSearchParams } from 'react-router-dom';
import { AgenticHeader } from '@/components/agentic/layout/AgenticHeader';
import { WeaveLayout } from '@/components/agentic/weave/WeaveLayout';
import { SpineLayout } from '@/components/agentic/spine/SpineLayout';
import { Card } from '@/components/ui/card';
import { IntelligenceDemoLayout } from '@/components/agentic/demo/IntelligenceDemoLayout';
import { UnifiedChatSidebar } from '@/components/agentic/shared/UnifiedChatSidebar';
import { ConversationStream } from '@/components/agentic/weave/ConversationStream';
import { InboxView } from '@/components/agentic/inbox/InboxView';
import { MiddlewareView } from '@/components/agentic/middleware/MiddlewareView';
import { ConfigurationView } from '@/components/agentic/configuration/ConfigurationView';
import { WeaveView } from '@/components/agentic/weave/WeaveView';
import { useAgentThreads } from '@/hooks/useAgentThreads';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';

export default function Agentic() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'inbox') as 'inbox' | 'weave' | 'decisions' | 'configuration' | 'workbench' | 'middleware' | 'test';
  const threadId = searchParams.get('t') || 't1';
  
  const { data: threads = [] } = useAgentThreads();
  const { realtimeMessages, isTyping } = useAgentMessagesRealtime(threadId);
  
  const selectedThread = threads.find((t) => t.id === threadId);
  
  // Safe participant count for both real and mock thread data
  const safeParticipantCount = Array.isArray(selectedThread?.participants)
    ? selectedThread.participants.length
    : (selectedThread && 'participantCount' in selectedThread
        ? (selectedThread as any).participantCount
        : 0);
  
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab, t: threadId });
  };
  
  const handleThreadSelect = (newThreadId: string) => {
    setSearchParams({ tab: activeTab, t: newThreadId });
  };

  return (
    <div className="h-screen flex flex-col agentic-ui">
      <AgenticHeader active={activeTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 overflow-hidden flex">
        {/* Unified Chat Sidebar - shown on all tabs except test, inbox, middleware, and weave */}
        {activeTab !== 'test' && activeTab !== 'inbox' && activeTab !== 'middleware' && activeTab !== 'weave' && (
          <UnifiedChatSidebar
            selectedThreadId={threadId}
            onThreadSelect={handleThreadSelect}
            className="w-[320px] flex-shrink-0"
          />
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'inbox' && <InboxView />}
          
          {activeTab === 'weave' && (
            <WeaveView workspaceId="demo-workspace" enterpriseId="demo-enterprise" />
          )}
          
          {activeTab === 'decisions' && (
            <SpineLayout threadId={threadId} />
          )}
          
          {activeTab === 'configuration' && (
            <ConfigurationView />
          )}
          
          {activeTab === 'workbench' && (
            <div className="flex items-center justify-center h-full p-8">
              <Card className="p-8 text-center max-w-md">
                <h2 className="text-xl font-semibold mb-2">Workbench Tab</h2>
                <p className="text-muted-foreground">Policy editing interface coming soon</p>
              </Card>
            </div>
          )}
          
          {activeTab === 'middleware' && <MiddlewareView />}
          
          {activeTab === 'test' && <IntelligenceDemoLayout />}
        </div>
      </div>
    </div>
  );
}
