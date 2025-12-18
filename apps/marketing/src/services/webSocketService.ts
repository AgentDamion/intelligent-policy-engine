import { getWsUrl } from '@/config/api';

interface WebSocketSubscription {
  id: string;
  callback: (data: any) => void;
  unsubscribe: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.CONNECTING || 
        this.ws?.readyState === WebSocket.OPEN || 
        this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = getWsUrl('/ws/unified');
      if (!wsUrl) {
        console.warn('WebSocket URL not configured');
        this.isConnecting = false;
        return;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Resubscribe to all active subscriptions
        this.subscriptions.forEach(sub => {
          this.sendMessage({
            type: 'subscribe',
            channel: sub.id
          });
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Route message to appropriate subscription
          if (data.channel && this.subscriptions.has(data.channel)) {
            const subscription = this.subscriptions.get(data.channel);
            subscription?.callback(data.payload || data);
          }

          // Handle unified events
          this.handleUnifiedEvent(data);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000 * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private handleUnifiedEvent(data: any) {
    // Handle governance events
    if (data.type === 'governance_event') {
      this.notifySubscribers('governance', data);
    }

    // Handle agent events (existing functionality)
    if (data.type === 'agent_activity') {
      this.notifySubscribers('agents', data);
    }

    // Handle approval updates
    if (data.type === 'approval_update') {
      this.notifySubscribers('approvals', data);
    }

    // Handle compliance updates
    if (data.type === 'compliance_update') {
      this.notifySubscribers('compliance', data);
    }

  // Handle document processing updates
    if (data.type === 'processing_update') {
      this.notifySubscribers('processing', data);
    }

    // Handle AI agent decisions
    if (data.type === 'ai_decision' || data.type === 'ai_agent_decision') {
      this.notifySubscribers('ai_decisions', data);
    }

    // Handle AI agent status updates
    if (data.type === 'ai_agent_status') {
      this.notifySubscribers('ai_agent_status', data);
    }
  }

  private notifySubscribers(channel: string, data: any) {
    this.subscriptions.forEach((subscription, id) => {
      if (id.startsWith(channel)) {
        subscription.callback(data);
      }
    });
  }

  public subscribe(channel: string, callback: (data: any) => void): () => void {
    const subscriptionId = `${channel}_${Date.now()}_${Math.random()}`;
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      callback,
      unsubscribe: () => {
        this.subscriptions.delete(subscriptionId);
        if (this.isConnected()) {
          this.sendMessage({
            type: 'unsubscribe',
            channel: subscriptionId
          });
        }
      }
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Subscribe immediately if connected
    if (this.isConnected()) {
      this.sendMessage({
        type: 'subscribe',
        channel: subscriptionId
      });
    }

    return subscription.unsubscribe;
  }

  // Existing methods for backward compatibility
  public subscribeToGovernance(callback?: (data: any) => void): () => void {
    return this.subscribe('governance', callback || (() => {}));
  }

  public subscribeToAgents(callback?: (data: any) => void): () => void {
    return this.subscribe('agents', callback || (() => {}));
  }

  // New unified subscription methods
  public subscribeToApprovals(callback: (data: any) => void): () => void {
    return this.subscribe('approvals', callback);
  }

  public subscribeToCompliance(callback: (data: any) => void): () => void {
    return this.subscribe('compliance', callback);
  }

  public subscribeToProcessing(callback: (data: any) => void): () => void {
    return this.subscribe('processing', callback);
  }

  // AI Agent subscription methods
  public subscribeToAIDecisions(callback: (data: any) => void): () => void {
    return this.subscribe('ai_decisions', callback);
  }

  public subscribeToAIAgentStatus(callback: (data: any) => void): () => void {
    return this.subscribe('ai_agent_status', callback);
  }

  public sendToAIAgent(agentId: string, message: any): boolean {
    return this.sendMessage({
      type: 'ai_agent_command',
      agentId,
      data: message,
      timestamp: new Date().toISOString()
    });
  }

  public sendMessage(message: any): boolean {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.subscriptions.clear();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(), 100);
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;

// Export class for testing
export { WebSocketService };
