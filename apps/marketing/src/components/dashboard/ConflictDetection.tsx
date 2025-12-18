import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from '@/config/api';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, FileText, Download } from "lucide-react";

interface Policy {
  name: string;
  content: string;
}

interface Conflict {
  type: string;
  severity: number;
  policies: string[];
  description: string;
  location: string;
  impact: string;
}

interface ConflictReport {
  timestamp: string;
  analysis_id: string;
  summary: {
    policies_analyzed: number;
    conflicts_found: number;
    severity_level: string;
    resolution_complexity: string;
    estimated_resolution_time: string;
  };
  conflicts: {
    list: Conflict[];
    severity_breakdown: Record<string, number>;
    impact_analysis: Record<string, any>;
  };
  resolution: {
    strategy: {
      strategy: string;
      type: string;
      reasoning: string;
      requires_human_review: boolean;
      estimated_time: string;
    };
    recommendations: {
      immediate_actions: string[];
      short_term_solutions: string[];
      long_term_improvements: string[];
    };
  };
}

const ConflictDetection: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([
    { name: '', content: '' },
    { name: '', content: '' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPolicy = () => {
    setPolicies([...policies, { name: '', content: '' }]);
  };

  const removePolicy = (index: number) => {
    if (policies.length > 2) {
      setPolicies(policies.filter((_, i) => i !== index));
    }
  };

  const updatePolicy = (index: number, field: 'name' | 'content', value: string) => {
    const updated = [...policies];
    updated[index][field] = value;
    setPolicies(updated);
  };

  const analyzeConflicts = async () => {
    setIsAnalyzing(true);
    setError(null);
    setConflictReport(null);

    try {
      // Filter out empty policies
      const validPolicies = policies.filter(p => p.name.trim() && p.content.trim());
      
      if (validPolicies.length < 2) {
        throw new Error('At least 2 policies with name and content are required');
      }

      const response = await fetch(getApiUrl('/api/analyze-conflicts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policies: validPolicies
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze conflicts');
      }

      const result = await response.json();
      setConflictReport(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 0.3) return 'bg-green-100 text-green-800';
    if (severity <= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 0.3) return 'Low';
    if (severity <= 0.7) return 'Medium';
    return 'High';
  };

  const exportReport = () => {
    if (!conflictReport) return;
    
    const reportText = `
CONFLICT ANALYSIS REPORT
Generated: ${new Date(conflictReport.timestamp).toLocaleString()}
Analysis ID: ${conflictReport.analysis_id}

SUMMARY:
- Policies Analyzed: ${conflictReport.summary.policies_analyzed}
- Conflicts Found: ${conflictReport.summary.conflicts_found}
- Severity Level: ${conflictReport.summary.severity_level}
- Resolution Complexity: ${conflictReport.summary.resolution_complexity}
- Estimated Resolution Time: ${conflictReport.summary.estimated_resolution_time}

CONFLICTS DETECTED:
${conflictReport.conflicts.list.map((conflict, i) => `
${i + 1}. ${conflict.description}
   Type: ${conflict.type}
   Severity: ${getSeverityLabel(conflict.severity)}
   Impact: ${conflict.impact}
   Location: ${conflict.location}
`).join('')}

RESOLUTION STRATEGY:
${conflictReport.resolution.strategy.reasoning}

IMMEDIATE ACTIONS:
${conflictReport.resolution.recommendations.immediate_actions.map(action => `- ${action}`).join('\n')}

SHORT-TERM SOLUTIONS:
${conflictReport.resolution.recommendations.short_term_solutions.map(solution => `- ${solution}`).join('\n')}

LONG-TERM IMPROVEMENTS:
${conflictReport.resolution.recommendations.long_term_improvements.map(improvement => `- ${improvement}`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conflict-analysis-${conflictReport.analysis_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Policy Conflict Detection
          </CardTitle>
          <CardDescription>
            Analyze multiple policies to identify conflicts, overlaps, and inconsistencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {policies.map((policy, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Policy {index + 1}</h4>
                {policies.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePolicy(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Input
                placeholder="Policy name (e.g., 'Pfizer AI Guidelines')"
                value={policy.name}
                onChange={(e) => updatePolicy(index, 'name', e.target.value)}
              />
              <Textarea
                placeholder="Paste policy content here..."
                value={policy.content}
                onChange={(e) => updatePolicy(index, 'content', e.target.value)}
                rows={6}
              />
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addPolicy}>
              Add Another Policy
            </Button>
            <Button 
              onClick={analyzeConflicts}
              disabled={isAnalyzing || policies.filter(p => p.name.trim() && p.content.trim()).length < 2}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Analyze Conflicts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {conflictReport && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Analysis Complete
                </CardTitle>
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {conflictReport.summary.policies_analyzed}
                  </div>
                  <div className="text-sm text-gray-600">Policies Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {conflictReport.summary.conflicts_found}
                  </div>
                  <div className="text-sm text-gray-600">Conflicts Found</div>
                </div>
                <div className="text-center">
                  <Badge className={getSeverityColor(0.5)}>
                    {conflictReport.summary.severity_level}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Severity Level</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {conflictReport.summary.estimated_resolution_time}
                  </div>
                  <div className="text-sm text-gray-600">Est. Resolution</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts List */}
          {conflictReport.conflicts.list.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Conflicts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conflictReport.conflicts.list.map((conflict, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{conflict.description}</h4>
                      <Badge className={getSeverityColor(conflict.severity)}>
                        {getSeverityLabel(conflict.severity)} Risk
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Type:</strong> {conflict.type.replace(/_/g, ' ')}</div>
                      <div><strong>Impact:</strong> {conflict.impact}</div>
                      <div><strong>Location:</strong> {conflict.location}</div>
                      <div><strong>Affects:</strong> {conflict.policies.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Resolution Strategy */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Recommended Approach: {conflictReport.resolution.strategy.strategy.replace(/_/g, ' ')}
                </h4>
                <p className="text-blue-800 text-sm">
                  {conflictReport.resolution.strategy.reasoning}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span>
                    <strong>Complexity:</strong> {conflictReport.resolution.strategy.type}
                  </span>
                  <span>
                    <strong>Human Review:</strong> {conflictReport.resolution.strategy.requires_human_review ? 'Required' : 'Optional'}
                  </span>
                  <span>
                    <strong>Timeline:</strong> {conflictReport.resolution.strategy.estimated_time}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium mb-2 text-red-800">Immediate Actions</h5>
                  <ul className="text-sm space-y-1">
                    {conflictReport.resolution.recommendations.immediate_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2 text-yellow-800">Short-term Solutions</h5>
                  <ul className="text-sm space-y-1">
                    {conflictReport.resolution.recommendations.short_term_solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2 text-green-800">Long-term Improvements</h5>
                  <ul className="text-sm space-y-1">
                    {conflictReport.resolution.recommendations.long_term_improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConflictDetection;