/**
 * Tool Misuse Detector
 * 
 * Detects patterns of tool misuse and anomalous agent behavior:
 * - Unusual tool call sequences
 * - Excessive data access attempts
 * - Suspicious parameter patterns
 * - Enumeration attacks
 * 
 * Works alongside AgentAuthorityValidator for defense-in-depth.
 */

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, unknown>;
  timestamp: number;
  success: boolean;
  enterpriseId: string;
  workspaceId?: string;
}

export interface MisuseDetectionResult {
  detected: boolean;
  confidence: number;
  misuseType: MisuseType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  recommendation: 'allow' | 'warn' | 'block' | 'terminate';
}

export type MisuseType =
  | 'enumeration_attack'
  | 'excessive_queries'
  | 'parameter_manipulation'
  | 'tool_sequence_anomaly'
  | 'data_exfiltration_pattern'
  | 'privilege_probe'
  | 'timing_anomaly'
  | 'resource_exhaustion';

interface ToolCallPattern {
  toolNames: string[];
  description: string;
  misuseType: MisuseType;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Suspicious tool call sequences
const SUSPICIOUS_PATTERNS: ToolCallPattern[] = [
  {
    toolNames: ['query_enterprise_data', 'query_enterprise_data', 'query_enterprise_data'],
    description: 'Repeated enterprise data queries may indicate enumeration',
    misuseType: 'enumeration_attack',
    confidence: 0.7,
    severity: 'high',
  },
  {
    toolNames: ['query_policies', 'delete_policy', 'delete_policy'],
    description: 'Bulk deletion pattern detected',
    misuseType: 'data_exfiltration_pattern',
    confidence: 0.8,
    severity: 'critical',
  },
  {
    toolNames: ['modify_enterprise_settings', 'create_policy', 'modify_enterprise_settings'],
    description: 'Rapid settings modification pattern',
    misuseType: 'privilege_probe',
    confidence: 0.75,
    severity: 'high',
  },
  {
    toolNames: ['query_audit_logs', 'query_audit_logs', 'query_audit_logs', 'query_audit_logs'],
    description: 'Excessive audit log queries may indicate reconnaissance',
    misuseType: 'excessive_queries',
    confidence: 0.6,
    severity: 'medium',
  },
];

// Suspicious parameter patterns
interface ParameterPattern {
  pattern: RegExp;
  misuseType: MisuseType;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

const SUSPICIOUS_PARAMETERS: ParameterPattern[] = [
  {
    pattern: /\*|%|SELECT\s+\*|DROP\s+|DELETE\s+FROM/i,
    misuseType: 'parameter_manipulation',
    confidence: 0.9,
    severity: 'critical',
    description: 'SQL injection attempt in parameters',
  },
  {
    pattern: /\.\.\/|\.\.\\|\/etc\/|\/proc\//i,
    misuseType: 'parameter_manipulation',
    confidence: 0.85,
    severity: 'critical',
    description: 'Path traversal attempt in parameters',
  },
  {
    pattern: /00000000-0000-0000-0000-000000000000/,
    misuseType: 'enumeration_attack',
    confidence: 0.7,
    severity: 'high',
    description: 'Null UUID used for enumeration',
  },
  {
    pattern: /admin|root|superuser|system/i,
    misuseType: 'privilege_probe',
    confidence: 0.5,
    severity: 'medium',
    description: 'Privileged term in parameters',
  },
  {
    pattern: /limit:\s*(\d+)/i,
    misuseType: 'data_exfiltration_pattern',
    confidence: 0.6,
    severity: 'medium',
    description: 'Large limit value may indicate bulk extraction',
  },
];

/**
 * Tool Misuse Detector class
 */
export class ToolMisuseDetector {
  private callHistory: Map<string, ToolCallRecord[]> = new Map();
  private readonly HISTORY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_HISTORY_SIZE = 100;

  // Thresholds for anomaly detection
  private readonly THRESHOLDS = {
    maxCallsPerMinute: 30,
    maxFailedCallsPercent: 0.5,
    maxUniqueEnterpriseIds: 3,
    maxSequentialSameToolCalls: 5,
    minCallIntervalMs: 100,
  };

  /**
   * Record a tool call for pattern analysis
   */
  recordToolCall(sessionId: string, record: ToolCallRecord): void {
    if (!this.callHistory.has(sessionId)) {
      this.callHistory.set(sessionId, []);
    }

    const history = this.callHistory.get(sessionId)!;
    history.push(record);

    // Prune old records
    const cutoff = Date.now() - this.HISTORY_WINDOW_MS;
    const pruned = history.filter(r => r.timestamp > cutoff);
    
    // Keep history manageable
    if (pruned.length > this.MAX_HISTORY_SIZE) {
      pruned.splice(0, pruned.length - this.MAX_HISTORY_SIZE);
    }
    
    this.callHistory.set(sessionId, pruned);
  }

  /**
   * Detect tool misuse patterns
   */
  detectMisuse(
    sessionId: string,
    currentCall: { toolName: string; args: Record<string, unknown> }
  ): MisuseDetectionResult {
    const history = this.callHistory.get(sessionId) || [];
    const results: MisuseDetectionResult[] = [];

    // Check for parameter manipulation
    const paramResult = this.checkParameterPatterns(currentCall.args);
    if (paramResult.detected) {
      results.push(paramResult);
    }

    // Check for suspicious tool sequences
    const sequenceResult = this.checkToolSequence(history, currentCall.toolName);
    if (sequenceResult.detected) {
      results.push(sequenceResult);
    }

    // Check for timing anomalies
    const timingResult = this.checkTimingAnomaly(history);
    if (timingResult.detected) {
      results.push(timingResult);
    }

    // Check for excessive queries
    const excessiveResult = this.checkExcessiveQueries(history);
    if (excessiveResult.detected) {
      results.push(excessiveResult);
    }

    // Check for enumeration patterns
    const enumerationResult = this.checkEnumerationPattern(history);
    if (enumerationResult.detected) {
      results.push(enumerationResult);
    }

    // Return the most severe detection
    if (results.length > 0) {
      results.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
      return results[0];
    }

    return {
      detected: false,
      confidence: 0,
      misuseType: 'tool_sequence_anomaly',
      severity: 'low',
      details: 'No misuse patterns detected',
      recommendation: 'allow',
    };
  }

  /**
   * Check for suspicious parameter patterns
   */
  private checkParameterPatterns(args: Record<string, unknown>): MisuseDetectionResult {
    const argsString = JSON.stringify(args);

    for (const pattern of SUSPICIOUS_PARAMETERS) {
      if (pattern.pattern.test(argsString)) {
        // Check for large limit values specifically
        if (pattern.description.includes('limit')) {
          const limitMatch = argsString.match(/limit['":\s]*(\d+)/i);
          if (limitMatch) {
            const limitValue = parseInt(limitMatch[1], 10);
            if (limitValue <= 100) {
              continue; // Normal limit, skip
            }
          }
        }

        return {
          detected: true,
          confidence: pattern.confidence,
          misuseType: pattern.misuseType,
          severity: pattern.severity,
          details: pattern.description,
          recommendation: pattern.severity === 'critical' ? 'block' : 'warn',
        };
      }
    }

    return {
      detected: false,
      confidence: 0,
      misuseType: 'parameter_manipulation',
      severity: 'low',
      details: 'No suspicious parameters detected',
      recommendation: 'allow',
    };
  }

  /**
   * Check for suspicious tool call sequences
   */
  private checkToolSequence(
    history: ToolCallRecord[],
    currentTool: string
  ): MisuseDetectionResult {
    const recentTools = history.slice(-5).map(r => r.toolName);
    recentTools.push(currentTool);

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (this.matchesSequence(recentTools, pattern.toolNames)) {
        return {
          detected: true,
          confidence: pattern.confidence,
          misuseType: pattern.misuseType,
          severity: pattern.severity,
          details: pattern.description,
          recommendation: pattern.severity === 'critical' ? 'block' : 'warn',
        };
      }
    }

    // Check for sequential same-tool calls
    const sequentialCount = this.countSequentialSameTool(recentTools);
    if (sequentialCount >= this.THRESHOLDS.maxSequentialSameToolCalls) {
      return {
        detected: true,
        confidence: 0.6,
        misuseType: 'excessive_queries',
        severity: 'medium',
        details: `${sequentialCount} sequential calls to the same tool`,
        recommendation: 'warn',
      };
    }

    return {
      detected: false,
      confidence: 0,
      misuseType: 'tool_sequence_anomaly',
      severity: 'low',
      details: 'Normal tool sequence',
      recommendation: 'allow',
    };
  }

  /**
   * Check if recent tools match a suspicious pattern
   */
  private matchesSequence(recent: string[], pattern: string[]): boolean {
    if (recent.length < pattern.length) return false;

    // Check if pattern appears in recent tools
    for (let i = 0; i <= recent.length - pattern.length; i++) {
      let matches = true;
      for (let j = 0; j < pattern.length; j++) {
        if (recent[i + j] !== pattern[j]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  }

  /**
   * Count sequential calls to the same tool
   */
  private countSequentialSameTool(tools: string[]): number {
    if (tools.length === 0) return 0;

    let maxCount = 1;
    let currentCount = 1;

    for (let i = 1; i < tools.length; i++) {
      if (tools[i] === tools[i - 1]) {
        currentCount++;
        maxCount = Math.max(maxCount, currentCount);
      } else {
        currentCount = 1;
      }
    }

    return maxCount;
  }

  /**
   * Check for timing anomalies (rapid-fire calls)
   */
  private checkTimingAnomaly(history: ToolCallRecord[]): MisuseDetectionResult {
    if (history.length < 2) {
      return {
        detected: false,
        confidence: 0,
        misuseType: 'timing_anomaly',
        severity: 'low',
        details: 'Insufficient history for timing analysis',
        recommendation: 'allow',
      };
    }

    // Check for calls that are too close together
    let rapidCallCount = 0;
    for (let i = 1; i < history.length; i++) {
      const interval = history[i].timestamp - history[i - 1].timestamp;
      if (interval < this.THRESHOLDS.minCallIntervalMs) {
        rapidCallCount++;
      }
    }

    // Check calls per minute
    const windowMs = history[history.length - 1].timestamp - history[0].timestamp;
    const callsPerMinute = (history.length / windowMs) * 60000;

    if (callsPerMinute > this.THRESHOLDS.maxCallsPerMinute) {
      return {
        detected: true,
        confidence: 0.7,
        misuseType: 'resource_exhaustion',
        severity: 'high',
        details: `High call frequency: ${callsPerMinute.toFixed(1)} calls/minute`,
        recommendation: 'warn',
      };
    }

    if (rapidCallCount > history.length * 0.5) {
      return {
        detected: true,
        confidence: 0.6,
        misuseType: 'timing_anomaly',
        severity: 'medium',
        details: `${rapidCallCount} rapid-fire tool calls detected`,
        recommendation: 'warn',
      };
    }

    return {
      detected: false,
      confidence: 0,
      misuseType: 'timing_anomaly',
      severity: 'low',
      details: 'Normal timing patterns',
      recommendation: 'allow',
    };
  }

  /**
   * Check for excessive failed queries (potential enumeration)
   */
  private checkExcessiveQueries(history: ToolCallRecord[]): MisuseDetectionResult {
    if (history.length < 5) {
      return {
        detected: false,
        confidence: 0,
        misuseType: 'excessive_queries',
        severity: 'low',
        details: 'Insufficient history',
        recommendation: 'allow',
      };
    }

    const failedCount = history.filter(r => !r.success).length;
    const failedPercent = failedCount / history.length;

    if (failedPercent > this.THRESHOLDS.maxFailedCallsPercent) {
      return {
        detected: true,
        confidence: 0.75,
        misuseType: 'enumeration_attack',
        severity: 'high',
        details: `${(failedPercent * 100).toFixed(0)}% of recent calls failed`,
        recommendation: 'block',
      };
    }

    return {
      detected: false,
      confidence: 0,
      misuseType: 'excessive_queries',
      severity: 'low',
      details: 'Normal failure rate',
      recommendation: 'allow',
    };
  }

  /**
   * Check for cross-tenant enumeration attempts
   */
  private checkEnumerationPattern(history: ToolCallRecord[]): MisuseDetectionResult {
    const uniqueEnterprises = new Set(history.map(r => r.enterpriseId));

    if (uniqueEnterprises.size > this.THRESHOLDS.maxUniqueEnterpriseIds) {
      return {
        detected: true,
        confidence: 0.9,
        misuseType: 'enumeration_attack',
        severity: 'critical',
        details: `Access attempts to ${uniqueEnterprises.size} different enterprises`,
        recommendation: 'terminate',
      };
    }

    return {
      detected: false,
      confidence: 0,
      misuseType: 'enumeration_attack',
      severity: 'low',
      details: 'Single-tenant access pattern',
      recommendation: 'allow',
    };
  }

  /**
   * Clear session history
   */
  clearSession(sessionId: string): void {
    this.callHistory.delete(sessionId);
  }

  /**
   * Get session statistics for monitoring
   */
  getSessionStats(sessionId: string): {
    callCount: number;
    uniqueTools: number;
    failureRate: number;
    oldestCall: number | null;
  } {
    const history = this.callHistory.get(sessionId) || [];
    const failedCount = history.filter(r => !r.success).length;

    return {
      callCount: history.length,
      uniqueTools: new Set(history.map(r => r.toolName)).size,
      failureRate: history.length > 0 ? failedCount / history.length : 0,
      oldestCall: history.length > 0 ? history[0].timestamp : null,
    };
  }
}

/**
 * Create a detector instance
 */
export function createToolMisuseDetector(): ToolMisuseDetector {
  return new ToolMisuseDetector();
}

/**
 * Quick detection helper
 */
export function detectToolMisuse(
  detector: ToolMisuseDetector,
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>,
  enterpriseId: string,
  workspaceId?: string,
  success: boolean = true
): MisuseDetectionResult {
  // Record the call
  detector.recordToolCall(sessionId, {
    toolName,
    args,
    timestamp: Date.now(),
    success,
    enterpriseId,
    workspaceId,
  });

  // Detect misuse
  return detector.detectMisuse(sessionId, { toolName, args });
}

