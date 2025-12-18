import { useState, useEffect } from 'react';
import { DemoMessage, DemoAgent } from '@/types/intelligenceDemo';
import { clsx } from 'clsx';
import { useMessageStreaming } from '@/hooks/useMessageStreaming';
import { ChevronDown, ChevronRight, Shield, Brain, Database, Puzzle } from 'lucide-react';
import { trackDemoEvent, DemoEvents } from '@/utils/demoTelemetry';

interface DemoAgentActivityProps {
  messages: DemoMessage[];
  isPlaying: boolean;
  playbackSpeed: number;
}

const getAgentColor = (agent: DemoAgent): string => {
  switch (agent) {
    case 'regulatory':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'ethics':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'data':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'integration':
      return 'text-pink-600 bg-pink-50 border-pink-200';
  }
};

const getAgentIcon = (agent: DemoAgent) => {
  switch (agent) {
    case 'regulatory':
      return Shield;
    case 'ethics':
      return Brain;
    case 'data':
      return Database;
    case 'integration':
      return Puzzle;
  }
};

const getAgentName = (agent: DemoAgent): string => {
  switch (agent) {
    case 'regulatory':
      return 'Regulatory Agent';
    case 'ethics':
      return 'Ethics Agent';
    case 'data':
      return 'Data Agent';
    case 'integration':
      return 'Integration Agent';
  }
};

const AgentMessage = ({
  message,
  isActive,
  playbackSpeed,
}: {
  message: DemoMessage;
  isActive: boolean;
  playbackSpeed: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayedText = useMessageStreaming(message.content, isActive, playbackSpeed);
  const Icon = getAgentIcon(message.agent);

  const handleExpand = () => {
    setExpanded(!expanded);
    trackDemoEvent(DemoEvents.DEMO_AGENT_EXPANDED, {
      agent: message.agent,
      message_id: message.id,
      expanded: !expanded,
    });
  };

  return (
    <div className={clsx('p-s4 border rounded-lg', getAgentColor(message.agent))}>
      <div className="flex items-start gap-s3">
        <div className="mt-1">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-s2 mb-s2">
            <span className="font-semibold text-sm">{getAgentName(message.agent)}</span>
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">
            {isActive ? displayedText : message.content}
            {isActive && displayedText.length < message.content.length && (
              <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
            )}
          </p>
          
          {(message.reasoning || message.policyReference) && (
            <button
              onClick={handleExpand}
              className="mt-s2 flex items-center gap-s1 text-xs font-medium hover:underline"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expanded ? 'Hide details' : 'Show reasoning'}
            </button>
          )}

          {expanded && (
            <div className="mt-s3 pt-s3 border-t space-y-s2">
              {message.reasoning && (
                <div>
                  <p className="text-xs font-semibold mb-s1">Reasoning:</p>
                  <p className="text-xs opacity-80">{message.reasoning}</p>
                </div>
              )}
              {message.policyReference && (
                <div>
                  <p className="text-xs font-semibold mb-s1">Policy Reference:</p>
                  <code className="text-xs opacity-80 font-mono">{message.policyReference}</code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DemoAgentActivity = ({
  messages,
  isPlaying,
  playbackSpeed,
}: DemoAgentActivityProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;

    // Show messages based on their timestamps
    const timers = messages.map((message, index) => {
      return setTimeout(() => {
        setVisibleMessages(index + 1);
        setActiveMessageIndex(index);
      }, message.timestamp / playbackSpeed);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [messages, isPlaying, playbackSpeed]);

  // Reset when not playing
  useEffect(() => {
    if (!isPlaying) {
      setVisibleMessages(0);
      setActiveMessageIndex(0);
    }
  }, [isPlaying]);

  const displayedMessages = messages.slice(0, visibleMessages);

  return (
    <div className="p-s6 max-w-4xl mx-auto">
      <div className="space-y-s4">
        {displayedMessages.length === 0 && (
          <div className="text-center py-s8 text-ink-500">
            <p>Press play to start agent conversation...</p>
          </div>
        )}
        
        {displayedMessages.map((message, index) => (
          <AgentMessage
            key={message.id}
            message={message}
            isActive={isPlaying && index === activeMessageIndex}
            playbackSpeed={playbackSpeed}
          />
        ))}
      </div>
    </div>
  );
};
