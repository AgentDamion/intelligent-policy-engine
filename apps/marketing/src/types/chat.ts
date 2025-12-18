/**
 * Core chat message interface - maps to chat_messages table
 */
export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: SuggestedAction[];
  metadata?: ChatMessageMetadata;
  workspace_id?: string;
  enterprise_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Suggested actions that agents can propose to users
 */
export interface SuggestedAction {
  id: string;
  label: string;
  description?: string;
  action_type: 'navigate' | 'download' | 'modal' | 'api';
  target: string;
  priority: 'high' | 'medium' | 'low';
  context?: Record<string, any>;
}

/**
 * Message metadata for tracking and context
 */
export interface ChatMessageMetadata {
  agent_activity_id?: number;
  agent?: string;
  action?: string;
  status?: string;
  in_response_to?: string;
  processing_time_ms?: number;
  synced_at?: string;
  [key: string]: any;
}

/**
 * Hook return type for useChatWidget
 */
export interface UseChatWidgetReturn {
  messages: ChatMessage[];
  unreadCount: number;
  isLoading: boolean;
  isSending: boolean;
  isConnected: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearUnread: () => void;
  error: Error | null;
}
