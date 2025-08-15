// api/middleware/audit-logging.js
// Audit Logging Middleware for B2B Compliance

const fs = require('fs');
const path = require('path');

// Parse audit logging configuration from environment
const getAuditConfig = () => {
  const enabled = process.env.AUDIT_LOG_ENABLED === 'true';
  const level = process.env.AUDIT_LOG_LEVEL || 'info';
  const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 90;
  
  return {
    enabled,
    level,
    retentionDays
  };
};

// Create audit log entry
const createAuditEntry = (req, action, details = {}) => {
  const config = getAuditConfig();
  
  if (!config.enabled) {
    return;
  }
  
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    userId: req.user?.sub || 'anonymous',
    userEmail: req.user?.email || 'anonymous',
    userRole: req.user?.role || 'anonymous',
    organizationId: req.user?.organizationId || 'none',
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    statusCode: req.statusCode,
    requestId: req.id || generateRequestId(),
    details: details,
    level: config.level
  };
  
  return auditEntry;
};

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Write audit log to file
const writeAuditLog = (auditEntry) => {
  const config = getAuditConfig();
  
  if (!config.enabled || !auditEntry) {
    return;
  }
  
  const logDir = path.join(__dirname, '../../logs');
  const logFile = path.join(logDir, 'audit.log');
  
  // Ensure logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Write audit entry
  const logLine = JSON.stringify(auditEntry) + '\n';
  
  try {
    fs.appendFileSync(logFile, logLine);
    console.log(`[AUDIT] ${auditEntry.action} by ${auditEntry.userEmail} (${auditEntry.ipAddress})`);
  } catch (error) {
    console.error('[AUDIT] Failed to write audit log:', error.message);
  }
};

// Audit logging middleware
const auditLoggingMiddleware = (req, res, next) => {
  const config = getAuditConfig();
  
  if (!config.enabled) {
    return next();
  }
  
  // Generate request ID
  req.id = generateRequestId();
  
  // Log request start
  const startTime = Date.now();
  
  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Create audit entry
    const auditEntry = createAuditEntry(req, 'api_request', {
      duration: duration,
      responseSize: chunk ? chunk.length : 0,
      statusCode: res.statusCode
    });
    
    // Write to audit log
    writeAuditLog(auditEntry);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Specific audit logging for sensitive actions
const auditSensitiveAction = (action) => {
  return (req, res, next) => {
    const config = getAuditConfig();
    
    if (!config.enabled) {
      return next();
    }
    
    // Log the sensitive action
    const auditEntry = createAuditEntry(req, action, {
      sensitive: true,
      resourceType: req.path.split('/')[2] || 'unknown',
      resourceId: req.params?.id || 'unknown'
    });
    
    writeAuditLog(auditEntry);
    next();
  };
};

// Audit logging for authentication events
const auditAuthEvent = (eventType) => {
  return (req, res, next) => {
    const config = getAuditConfig();
    
    if (!config.enabled) {
      return next();
    }
    
    const auditEntry = createAuditEntry(req, `auth_${eventType}`, {
      authEvent: eventType,
      success: res.statusCode < 400
    });
    
    writeAuditLog(auditEntry);
    next();
  };
};

// Audit logging for policy changes
const auditPolicyChange = (changeType) => {
  return (req, res, next) => {
    const config = getAuditConfig();
    
    if (!config.enabled) {
      return next();
    }
    
    const auditEntry = createAuditEntry(req, `policy_${changeType}`, {
      policyId: req.params?.id || req.body?.policyId,
      changeType: changeType,
      policyName: req.body?.name || 'unknown'
    });
    
    writeAuditLog(auditEntry);
    next();
  };
};

// Audit logging for AI interactions
const auditAIInteraction = (interactionType) => {
  return (req, res, next) => {
    const config = getAuditConfig();
    
    if (!config.enabled) {
      return next();
    }
    
    const auditEntry = createAuditEntry(req, `ai_${interactionType}`, {
      aiProvider: req.body?.provider || 'unknown',
      interactionType: interactionType,
      tokenCount: req.body?.tokenCount || 0
    });
    
    writeAuditLog(auditEntry);
    next();
  };
};

// Function to get audit logs
const getAuditLogs = (filters = {}) => {
  const config = getAuditConfig();
  
  if (!config.enabled) {
    return [];
  }
  
  const logFile = path.join(__dirname, '../../logs/audit.log');
  
  if (!fs.existsSync(logFile)) {
    return [];
  }
  
  try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.trim().split('\n');
    
    let logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    
    // Apply filters
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    
    if (filters.organizationId) {
      logs = logs.filter(log => log.organizationId === filters.organizationId);
    }
    
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }
    
    return logs;
  } catch (error) {
    console.error('[AUDIT] Failed to read audit logs:', error.message);
    return [];
  }
};

// Function to clean old audit logs
const cleanOldAuditLogs = () => {
  const config = getAuditConfig();
  
  if (!config.enabled) {
    return;
  }
  
  const logFile = path.join(__dirname, '../../logs/audit.log');
  
  if (!fs.existsSync(logFile)) {
    return;
  }
  
  try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.trim().split('\n');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    
    const filteredLines = lines.filter(line => {
      try {
        const logEntry = JSON.parse(line);
        return new Date(logEntry.timestamp) >= cutoffDate;
      } catch (error) {
        return false;
      }
    });
    
    fs.writeFileSync(logFile, filteredLines.join('\n') + '\n');
    console.log(`[AUDIT] Cleaned logs older than ${config.retentionDays} days`);
  } catch (error) {
    console.error('[AUDIT] Failed to clean old logs:', error.message);
  }
};

module.exports = {
  auditLoggingMiddleware,
  auditSensitiveAction,
  auditAuthEvent,
  auditPolicyChange,
  auditAIInteraction,
  getAuditLogs,
  cleanOldAuditLogs,
  getAuditConfig
}; 