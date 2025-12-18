import { getApiUrl } from '@/config/api';

export interface LighthouseEvent {
  id: string;
  timestamp: string;
  type: 'connection' | 'command' | 'response' | 'error';
  message: string;
  data?: any;
}

export interface LighthouseCommand {
  action: string;
  payload?: any;
}

export class LighthouseConnection {
  private ws: WebSocket | null = null;
  private events: LighthouseEvent[] = [];
  private eventCallbacks: ((event: LighthouseEvent) => void)[] = [];
  private isConnected = false;

  constructor() {
    this.addEvent('connection', 'Lighthouse demo initialized');
  }

  // WebSocket connection methods
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = getApiUrl('/ws/lighthouse').replace('http', 'ws');
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.addEvent('connection', 'WebSocket connected successfully');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.addEvent('response', 'Received WebSocket message', data);
          } catch (error) {
            this.addEvent('response', `Raw message: ${event.data}`);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.addEvent('connection', 'WebSocket connection closed');
        };

        this.ws.onerror = (error) => {
          this.addEvent('error', `WebSocket error: ${error}`);
          reject(error);
        };
      } catch (error) {
        this.addEvent('error', `Failed to connect: ${error}`);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.addEvent('connection', 'Disconnected from WebSocket');
  }

  // Send WebSocket command
  sendCommand(command: LighthouseCommand): void {
    if (!this.isConnected || !this.ws) {
      this.addEvent('error', 'Not connected to WebSocket');
      return;
    }

    try {
      const message = JSON.stringify(command);
      this.ws.send(message);
      this.addEvent('command', `Sent command: ${command.action}`, command);
    } catch (error) {
      this.addEvent('error', `Failed to send command: ${error}`);
    }
  }

  // REST API methods
  async testRestEndpoint(endpoint: string, method: 'GET' | 'POST' = 'GET', payload?: any): Promise<void> {
    try {
      const url = getApiUrl(endpoint);
      this.addEvent('command', `Testing ${method} ${endpoint}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(payload && { body: JSON.stringify(payload) }),
      });

      const data = await response.text();
      this.addEvent('response', `${method} ${endpoint} - Status: ${response.status}`, { 
        status: response.status,
        data: data || 'No response body'
      });
    } catch (error) {
      this.addEvent('error', `REST ${method} ${endpoint} failed: ${error}`);
    }
  }

  // Event management
  private addEvent(type: LighthouseEvent['type'], message: string, data?: any): void {
    const event: LighthouseEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };

    this.events.push(event);
    this.eventCallbacks.forEach(callback => callback(event));

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  // Public getters and subscribers
  getEvents(): LighthouseEvent[] {
    return [...this.events];
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  onEvent(callback: (event: LighthouseEvent) => void): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  // Predefined test commands
  getTestCommands(): { name: string; command: LighthouseCommand }[] {
    return [
      {
        name: 'Health Check',
        command: { action: 'health_check' }
      },
      {
        name: 'Get Status',
        command: { action: 'get_status' }
      },
      {
        name: 'Test Policy Validation',
        command: { 
          action: 'validate_policy',
          payload: { 
            policy_id: 'test-policy-001',
            content: 'Sample AI decision for testing'
          }
        }
      },
      {
        name: 'Simulate AI Decision',
        command: { 
          action: 'ai_decision',
          payload: { 
            model: 'gpt-4',
            prompt: 'What is the capital of France?',
            context: 'geography'
          }
        }
      }
    ];
  }

  // Clear events
  clearEvents(): void {
    this.events = [];
    this.addEvent('connection', 'Event log cleared');
  }
}
