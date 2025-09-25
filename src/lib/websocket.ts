// WebSocket helper for real-time governance events

export interface WebSocketMessage {
  type: 'governance_event' | 'policy_update' | 'compliance_alert' | 'heartbeat' | 'ai_decision' | 'ai_analysis' | 'ai_alert'
  data: any
  timestamp: string
}

export class GovernanceWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null
  private onStatusCallback: ((connected: boolean) => void) | null = null

  constructor(
    private wsUrl: string,
    private session: any
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Add authentication token to WebSocket URL
        const token = this.session?.access_token
        const url = token ? `${this.wsUrl}?token=${token}` : this.wsUrl
        
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket connected to governance stream')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.onStatusCallback?.(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.onMessageCallback?.(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.stopHeartbeat()
          this.onStatusCallback?.(false)
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.onStatusCallback?.(false)
          reject(error)
        }

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback
  }

  onStatusChange(callback: (connected: boolean) => void): void {
    this.onStatusCallback = callback
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString()
      })
    }, 30000) // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }
}

// Hook for using WebSocket in React components
export const useGovernanceWebSocket = (session: any) => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
  
  return {
    createConnection: () => new GovernanceWebSocket(wsUrl, session),
    wsUrl
  }
}
