/**
 * Application monitoring and logging utilities
 */

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  source?: string;
  userId?: string;
  sessionId?: string;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    data?: any,
    source?: string
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source,
      userId: this.userId,
      sessionId: this.sessionId
    };
  }

  error(message: string, error?: Error | any, source?: string) {
    const logEntry = this.createLogEntry('ERROR', message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }, source);

    console.error(logEntry);
  }

  warn(message: string, data?: any, source?: string) {
    const logEntry = this.createLogEntry('WARN', message, data, source);
    console.warn(logEntry);
  }

  info(message: string, data?: any, source?: string) {
    const logEntry = this.createLogEntry('INFO', message, data, source);
    console.info(logEntry);
  }

  debug(message: string, data?: any, source?: string) {
    if (import.meta.env.DEV) {
      const logEntry = this.createLogEntry('DEBUG', message, data, source);
      console.debug(logEntry);
    }
  }

  // Performance monitoring
  startTiming(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // API monitoring
  trackApiCall(endpoint: string, method: string, status: number, duration: number) {
    const logEntry = this.createLogEntry('INFO', 'API Call', {
      endpoint,
      method,
      status,
      duration: `${duration.toFixed(2)}ms`,
      success: status >= 200 && status < 300
    }, 'api');

    if (status >= 400) {
      this.error(`API Error: ${method} ${endpoint}`, { status, duration });
    } else {
      console.log(logEntry);
    }
  }

  // User action tracking
  trackUserAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, data, 'user');
  }

  // Enhanced event logging for route analytics
  logEvent(eventName: string, data?: any) {
    this.info(`Event: ${eventName}`, data, 'event');
  }
}

export const monitoring = new MonitoringService();

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  monitoring.error('Unhandled Promise Rejection', event.reason, 'global');
});

window.addEventListener('error', (event) => {
  monitoring.error('Global Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  }, 'global');
});
