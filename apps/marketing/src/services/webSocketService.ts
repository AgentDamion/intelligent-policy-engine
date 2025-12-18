// Enhanced WebSocket Service with AI Agent Support
import { GovernanceWebSocket, WebSocketMessage } from '../lib/websocket'

export interface AIAgentMessage {
  type: 'ai_decision' | 'ai_analysis' | 'ai_alert' | 'governance_event' | 'policy_update' | 'compliance_alert' | 'heartbeat'
  data: any
  timestamp: string
  agentId?: string
  decision?: any
}

class WebSocketService {
  private ws: GovernanceWebSocket | null = null
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()

  /**
   * Initialize WebSocket connection
   */
  async connect(session: any) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
    this.ws = new GovernanceWebSocket(wsUrl, session)
    
    // Set up message handler
    this.ws.onMessage((message: AIAgentMessage) => {
      this.handleMessage(message)
    })
    
    // Connect
    await this.ws.connect()
  }

  /**
   * Handle incoming messages and distribute to subscribers
   */
  private handleMessage(message: AIAgentMessage) {
    // Distribute to type-specific subscribers
    const typeSubscribers = this.subscribers.get(message.type)
    if (typeSubscribers) {
      typeSubscribers.forEach(callback => callback(message.data))
    }
    
    // Distribute to agent-specific subscribers if agentId present
    if (message.agentId) {
      const agentSubscribers = this.subscribers.get(`agent:${message.agentId}`)
      if (agentSubscribers) {
        agentSubscribers.forEach(callback => callback(message))
      }
    }
    
    // Distribute to wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*')
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(callback => callback(message))
    }
  }

  /**
   * Subscribe to messages of a specific type
   */
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set())
    }
    
    this.subscribers.get(channel)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(channel)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.subscribers.delete(channel)
        }
      }
    }
  }

  /**
   * Subscribe to Cursor AI agents
   */
  subscribeToCursorAgents(callback: (data: any) => void): () => void {
    return this.subscribe('ai_decision', callback)
  }

  /**
   * Send message to specific agent
   */
  sendToAgent(agentId: string, message: any): boolean {
    if (!this.ws || !this.ws) return false
    
    const aiMessage: AIAgentMessage = {
      type: 'ai_decision',
      agentId,
      data: message,
      timestamp: new Date().toISOString()
    }
    // Cast to WebSocketMessage for send method
    const wsMessage: WebSocketMessage = {
      type: aiMessage.type,
      data: { ...aiMessage.data, agentId },
      timestamp: aiMessage.timestamp
    }
    this.ws.send(wsMessage)
    
    return true
  }

  /**
   * Send general message
   */
  sendMessage(message: AIAgentMessage): boolean {
    if (!this.ws) return false
    
    // Cast to WebSocketMessage for send method
    const wsMessage: WebSocketMessage = {
      type: message.type,
      data: message.agentId ? { ...message.data, agentId: message.agentId } : message.data,
      timestamp: message.timestamp || new Date().toISOString()
    }
    this.ws.send(wsMessage)
    
    return true
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.disconnect()
      this.ws = null
    }
    this.subscribers.clear()
  }
}

// Singleton instance
export const webSocketService = new WebSocketService()
