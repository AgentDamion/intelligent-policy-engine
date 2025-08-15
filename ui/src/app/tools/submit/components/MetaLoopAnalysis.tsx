import React from 'react';
import { Button, Card, Skeleton } from '@/components/ui';
import type { PrecheckResult } from '../types';
import { Brain, RefreshCw, AlertTriangle, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface MetaLoopAnalysisProps {
  analysis: PrecheckResult | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export function MetaLoopAnalysis({ analysis, isAnalyzing, onRunAnalysis }: MetaLoopAnalysisProps) {
  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-600" />;
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOverallRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-900">Meta-Loop Analysis</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Run Analysis</span>
          </Button>
        </div>

        {/* Analysis Content */}
        {isAnalyzing ? (
          <div className="space-y-3">
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
                <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
              </div>
              <p className="text-sm text-gray-600 mb-2">Running AI analysis...</p>
              <p className="text-xs text-gray-500">
                Evaluating risks, compliance gaps, and recommendations
              </p>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Overall Assessment */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Overall Risk</span>
                <span className={`font-medium ${getOverallRiskColor(analysis.overallRisk)}`}>
                  {analysis.overallRisk?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Confidence</span>
                <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                  {Math.round(analysis.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Risk Assessment */}
            {analysis.risks && analysis.risks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Risk Categories
                </h4>
                <div className="space-y-2">
                  {analysis.risks.slice(0, 3).map((risk, index) => (
                    <div
                      key={index}
                      className={`p-2 border rounded text-xs ${getRiskColor(risk.severity)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {getRiskIcon(risk.severity)}
                          <span className="font-medium">{risk.label}</span>
                        </div>
                        <span className="uppercase text-xs">
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-xs opacity-80">
                        {risk.rationale}
                      </p>
                    </div>
                  ))}
                  {analysis.risks.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{analysis.risks.length - 3} more risks identified
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                  {analysis.recommendations.length > 3 && (
                    <li className="text-xs text-gray-500 text-center">
                      +{analysis.recommendations.length - 3} more recommendations
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Compliance Gaps */}
            {analysis.complianceGaps && analysis.complianceGaps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Compliance Gaps
                </h4>
                <ul className="space-y-1">
                  {analysis.complianceGaps.slice(0, 2).map((gap, index) => (
                    <li key={index} className="text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                  {analysis.complianceGaps.length > 2 && (
                    <li className="text-xs text-gray-500 text-center">
                      +{analysis.complianceGaps.length - 2} more gaps identified
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Last Analysis Footer */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Analysis powered by Meta-Loop AI
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Brain className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No analysis yet</p>
            <p className="text-xs text-gray-500 mb-4">
              Run AI-powered risk assessment and get intelligent recommendations
            </p>
            <Button size="sm" onClick={onRunAnalysis} className="w-full">
              <Zap className="h-3 w-3 mr-1" />
              Run Analysis
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
