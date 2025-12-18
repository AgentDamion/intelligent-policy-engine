import { useState, useEffect, useRef, useCallback } from 'react';
import { getWsUrl } from '@/config/api';

interface WebSocketOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: any;
  reconnectAttempts: number;
}

export const useWebSocket = (endpoint: string = '', options: WebSocketOptions = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wsUrl = getWsUrl(endpoint);
      if (!wsUrl || wsUrl === endpoint) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'WebSocket URL not configured'
        }));
        return;
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0
        }));
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.(data);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', event.data);
          setState(prev => ({ ...prev, lastMessage: event.data }));
          onMessage?.(event.data);
        }
      };

      wsRef.current.onclose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));
        onClose?.();

        // Attempt reconnection if enabled and under max attempts
        if (shouldReconnectRef.current && 
            state.reconnectAttempts < maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            reconnectAttempts: prev.reconnectAttempts + 1 
          }));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false
        }));
        onError?.(error);
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to create WebSocket'
      }));
    }
  }, [endpoint, onMessage, onError, onOpen, onClose, reconnectInterval, maxReconnectAttempts, state.reconnectAttempts]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastMessage: null,
      reconnectAttempts: 0
    });
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageString);
      return true;
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, reconnectAttempts: 0 }));
    shouldReconnectRef.current = true;
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    // Listen for API settings changes
    const handleSettingsChange = () => {
      if (state.isConnected || state.isConnecting) {
        reconnect();
      }
    };
    
    window.addEventListener('api-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('api-settings-changed', handleSettingsChange);
  }, [reconnect, state.isConnected, state.isConnecting]);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    sendMessage
  };
};