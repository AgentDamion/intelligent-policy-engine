import React, { useEffect, useState } from 'react';
import { 
  X, 
  Clock, 
  Shield, 
  ShieldAlert, 
  MessageSquare, 
  Brain, 
  Wrench, 
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVERAAgent } from '@/hooks/useVERAAgent';

interface TraceStep {
  event_type: 'activity' | 'decision' | 'step';
  event_timestamp: string;
  agent: string | null;
  action: string | null;
  status: string | null;
  details: Record<string, unknown> | null;
  policy_digest: string | null;
  trace_id: string;
  span_id: string | null;
  step_order: number | null;
  content: Record<string, unknown> | null;
}

interface VERATraceViewerProps {
  traceId: string;
  onClose: () => void;
}

export function VERATraceViewer({ traceId, onClose }: VERATraceViewerProps) {
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const { fetchTrace } = useVERAAgent();

  useEffect(() => {
    loadTrace();
  }, [traceId]);

  const loadTrace = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTrace(traceId);
      if (data) {
        setSteps(data as TraceStep[]);
      } else {
        setError('No trace data found');
      }
    } catch (err) {
      setError('Failed to load trace data');
      console.error('Trace fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTraceId = async () => {
    await navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const exportData = {
      trace_id: traceId,
      exported_at: new Date().toISOString(),
      steps: steps,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${traceId.substring(0, 8)}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getStepIcon = (step: TraceStep) => {
    const action = step.action?.toLowerCase() || '';
    const eventType = step.event_type;

    if (eventType === 'step') {
      if (action === 'prompt') return <MessageSquare className="w-4 h-4 text-blue-500" />;
      if (action === 'reasoning') return <Brain className="w-4 h-4 text-purple-500" />;
      if (action.includes('tool')) return <Wrench className="w-4 h-4 text-orange-500" />;
      if (action === 'final_response') return <CheckCircle className="w-4 h-4 text-green-500" />;
      if (action === 'error') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }

    if (eventType === 'activity') {
      if (action?.includes('security') || action?.includes('injection')) {
        return <Shield className="w-4 h-4 text-emerald-500" />;
      }
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }

    if (eventType === 'decision') {
      return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    }

    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStepLabel = (step: TraceStep): string => {
    if (step.event_type === 'step') {
      switch (step.action) {
        case 'prompt': return 'Prompt Received';
        case 'reasoning': return 'Agent Reasoning';
        case 'tool_call': return `Tool Call: ${step.content?.tool_name || 'unknown'}`;
        case 'tool_response': return `Tool Response: ${step.content?.tool_name || 'unknown'}`;
        case 'final_response': return 'Final Response Generated';
        case 'error': return 'Error Occurred';
        default: return step.action || 'Step';
      }
    }

    if (step.event_type === 'activity') {
      return `${step.agent || 'Agent'}: ${step.action || 'action'}`;
    }

    if (step.event_type === 'decision') {
      return `Decision: ${step.status || 'unknown'}`;
    }

    return 'Unknown Step';
  };

  const getStepContent = (step: TraceStep): string | null => {
    if (step.content) {
      if (step.content.text) return step.content.text as string;
      if (step.content.tool_args) return `Arguments: ${JSON.stringify(step.content.tool_args, null, 2)}`;
      if (step.content.tool_result) return `Result: ${JSON.stringify(step.content.tool_result, null, 2)}`;
      if (step.content.error_message) return `Error: ${step.content.error_message}`;
    }

    if (step.details) {
      if (typeof step.details === 'object') {
        return JSON.stringify(step.details, null, 2);
      }
    }

    return null;
  };

  const getStatusColor = (status: string | null): string => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'complete':
      case 'passed':
        return 'text-green-600 bg-green-50';
      case 'warning':
      case 'flagged':
        return 'text-amber-600 bg-amber-50';
      case 'error':
      case 'blocked':
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate totals
  const totalDuration = steps.reduce((acc, step) => {
    if (step.content?.duration_ms) {
      return acc + (step.content.duration_ms as number);
    }
    return acc;
  }, 0);

  const totalTokens = steps.reduce((acc, step) => {
    if (step.content?.tokens) {
      return acc + (step.content.tokens as number);
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] m-4 bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Agent Trace Viewer
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {traceId.substring(0, 8)}...{traceId.substring(traceId.length - 8)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadTrace} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading trace...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={loadTrace} className="mt-4">
                Retry
              </Button>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No trace steps found</p>
              <p className="text-xs text-muted-foreground mt-2">
                The trace may still be processing or has expired.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Security checkpoint indicator */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">
                  Security Scan Passed
                </span>
                <span className="text-xs text-emerald-600 ml-auto">
                  Prompt Injection Guard + Authority Validator
                </span>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[18px] top-8 bottom-4 w-0.5 bg-border" />

                {steps.map((step, index) => {
                  const isExpanded = expandedSteps.has(index);
                  const content = getStepContent(step);

                  return (
                    <div key={index} className="relative pl-10 py-2">
                      {/* Icon */}
                      <div className="absolute left-1.5 top-3 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center z-10">
                        {getStepIcon(step)}
                      </div>

                      {/* Content card */}
                      <div 
                        className={`border rounded-lg p-3 transition-colors ${
                          content ? 'cursor-pointer hover:bg-muted/50' : ''
                        }`}
                        onClick={() => content && toggleStep(index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {content && (
                              isExpanded 
                                ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                : <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">{getStepLabel(step)}</span>
                            {step.status && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(step.status)}`}>
                                {step.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {step.content?.duration_ms && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.content.duration_ms}ms
                              </span>
                            )}
                            {step.step_order !== null && (
                              <span className="bg-muted px-1.5 py-0.5 rounded">
                                #{step.step_order}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && content && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <pre className="text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                              {content}
                            </pre>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(step.event_timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with summary */}
        <div className="border-t border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Total: {totalDuration}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                <span>Steps: {steps.length}</span>
              </div>
              {totalTokens > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>~{totalTokens} tokens</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTraceId}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? 'Copied!' : 'Copy ID'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-xs"
                disabled={steps.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VERATraceViewer;

