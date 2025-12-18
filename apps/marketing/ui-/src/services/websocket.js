// ui/src/services/websocket.js - Production WebSocket service
class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.subscriptions = new Set();
  }
  
  getWebSocketUrl() {
    if (process.env.NODE_ENV === 'production') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    } else {
      return 'ws://localhost:3000/ws';
    }
  }
  
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }
    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.subscriptions.forEach(subscription => {
            this.send(subscription.type, subscription.data);
          });
          this.emit('connected', true);
          resolve();
        };
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data.type);
            this.emit(data.type, data.data || data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };
        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.emit('connected', false);
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect().catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }
    }, delay);
  }
  
  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, ...data };
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent WebSocket message:', type);
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message:', type);
      return false;
    }
  }
  
  subscribeToGovernance() {
    console.log('🔌 Subscribing to governance events...');
    const message = { type: 'subscribe_to_governance' };
    this.subscriptions.add(message);
    return this.send('subscribe_to_governance');
  }
  
  subscribeToAgents() {
    console.log('🔌 Subscribing to agent updates...');
    const message = { type: 'subscribe_to_agents' };
    this.subscriptions.add(message);
    return this.send('subscribe_to_agents');
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }
  
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
  }
  
  ping() {
    return this.send('ping');
  }
  
  startHeartbeat(interval = 30000) {
    setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      }
    }, interval);
  }
}

const webSocketService = new WebSocketService();
webSocketService.connect().then(() => {
  webSocketService.startHeartbeat();
}).catch(error => {
  console.log('⚠️ Initial WebSocket connection failed - will retry automatically');
});

export default webSocketService; 