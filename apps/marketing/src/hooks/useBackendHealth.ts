import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/config/api';
import { monitoring } from '@/utils/monitoring';

interface BackendHealth {
  status: 'online' | 'degraded' | 'offline' | 'checking';
  message: string;
  lastChecked: Date | null;
  responseTime?: number;
  endpoints?: string[];
}

export const useBackendHealth = (checkInterval = 30000) => {
  const [health, setHealth] = useState<BackendHealth>({
    status: 'checking',
    message: 'Checking backend status...',
    lastChecked: null
  });

  const checkHealth = useCallback(async (): Promise<BackendHealth> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(getApiUrl('/api'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        const status = responseTime > 3000 ? 'degraded' : 'online';
        const message = responseTime > 3000 ? 
          `Backend responding slowly (${responseTime}ms)` : 
          `Backend active (${responseTime}ms)`;
        
        return {
          status,
          message: data.message || message,
          lastChecked: new Date(),
          responseTime,
          endpoints: data.endpoints || []
        };
      } else {
        return {
          status: 'degraded',
          message: `HTTP ${response.status}: ${response.statusText}`,
          lastChecked: new Date(),
          responseTime
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        (error.name === 'AbortError' ? 'Request timeout' : error.message) : 
        'Connection failed';
      
      // Log health check failures
      monitoring.error('Backend health check failed', error as Error, 'useBackendHealth');
      
      return {
        status: 'offline',
        message: errorMessage,
        lastChecked: new Date()
      };
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, status: 'checking', message: 'Checking...' }));
    const newHealth = await checkHealth();
    setHealth(newHealth);
    return newHealth;
  }, [checkHealth]);

  useEffect(() => {
    // Initial check
    refreshHealth();
    
    // Periodic checks
    if (checkInterval > 0) {
      const interval = setInterval(refreshHealth, checkInterval);
      return () => clearInterval(interval);
    }
  }, [refreshHealth, checkInterval]);

  useEffect(() => {
    // Listen for API settings changes
    const handleSettingsChange = () => {
      refreshHealth();
    };
    
    window.addEventListener('api-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('api-settings-changed', handleSettingsChange);
  }, [refreshHealth]);

  return {
    health,
    refreshHealth,
    isOnline: health.status === 'online',
    isDegraded: health.status === 'degraded',
    isOffline: health.status === 'offline',
    isChecking: health.status === 'checking'
  };
};