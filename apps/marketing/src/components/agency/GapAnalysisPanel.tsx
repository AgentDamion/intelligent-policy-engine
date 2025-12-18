import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  XCircle, 
  TrendingDown, 
  Target,
  ChevronRight
} from 'lucide-react';
import type { ClientCompliance } from '@/hooks/useClientComplianceData';

interface GapAnalysisPanelProps {
  clients: ClientCompliance[];
}

interface GapAnalysis {
  area: string;
  affectedClients: number;
  totalClients: number;
  averageScore: number;
  severity: 'high' | 'medium' | 'low';
  commonIssues: string[];
  recommendedActions: string[];
}

export const GapAnalysisPanel: React.FC<GapAnalysisPanelProps> = ({ clients }) => {
  // Analyze gaps across all clients
  const analyzeGaps = (): GapAnalysis[] => {
    const areaMap = new Map<string, {
      scores: number[];
      issues: string[];
      clientNames: string[];
    }>();

    // Collect data for each compliance area
    clients.forEach(client => {
      client.complianceAreas.forEach(area => {
        if (!areaMap.has(area.name)) {
          areaMap.set(area.name, { scores: [], issues: [], clientNames: [] });
        }
        
        const areaData = areaMap.get(area.name)!;
        areaData.scores.push(area.score);
        areaData.clientNames.push(client.name);
        
        if (area.status !== 'compliant') {
          areaData.issues.push(area.details);
        }
      });
    });

    // Generate gap analysis
    return Array.from(areaMap.entries()).map(([areaName, data]) => {
      const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      const affectedClients = data.scores.filter(score => score < 90).length;
      
      let severity: 'high' | 'medium' | 'low';
      if (averageScore < 70) severity = 'high';
      else if (averageScore < 85) severity = 'medium';
      else severity = 'low';

      // Common issues and recommendations based on area
      const commonIssues = data.issues.slice(0, 3);
      const recommendedActions = getRecommendedActions(areaName, severity);

      return {
        area: areaName,
        affectedClients,
        totalClients: clients.length,
        averageScore: Math.round(averageScore),
        severity,
        commonIssues,
        recommendedActions
      };
    }).sort((a, b) => {
      // Sort by severity and affected clients
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity] || 
             b.affectedClients - a.affectedClients;
    });
  };

  const getRecommendedActions = (area: string, severity: 'high' | 'medium' | 'low'): string[] => {
    const actionMap: Record<string, string[]> = {
      '21 CFR Part 11': [
        'Implement electronic signature workflows',
        'Update record retention policies',
        'Conduct system validation'
      ],
      'Data Integrity': [
        'Strengthen data governance framework',
        'Implement automated validation checks',
        'Update data handling procedures'
      ],
      'Audit Trail': [
        'Deploy comprehensive logging system',
        'Implement decision tracking',
        'Update audit trail procedures'
      ],
      'Risk Management': [
        'Update risk assessment framework',
        'Implement continuous monitoring',
        'Establish risk mitigation protocols'
      ],
      'Model Risk Management': [
        'Develop AI model governance',
        'Implement model validation process',
        'Establish performance monitoring'
      ],
      'Data Privacy': [
        'Conduct privacy impact assessment',
        'Update consent management',
        'Implement data minimization'
      ]
    };

    return actionMap[area] || ['Conduct detailed assessment', 'Implement best practices', 'Regular monitoring'];
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Target className="h-4 w-4" />;
    }
  };

  const gaps = analyzeGaps();
  const totalGaps = gaps.filter(gap => gap.severity === 'high' || gap.severity === 'medium').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Gap Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Identified {totalGaps} areas requiring attention across all clients
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            {gaps.length} Areas Analyzed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {gaps.map((gap, index) => (
          <motion.div
            key={gap.area}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${getSeverityColor(gap.severity)}`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(gap.severity)}
                  <h3 className="font-medium">{gap.area}</h3>
                  <Badge variant="secondary">
                    {gap.severity} priority
                  </Badge>
                </div>
                <div className="text-sm font-medium">
                  {gap.affectedClients}/{gap.totalClients} clients affected
                </div>
              </div>

              {/* Average Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Compliance Score</span>
                  <span className="font-medium">{gap.averageScore}%</span>
                </div>
                <Progress value={gap.averageScore} className="h-2" />
              </div>

              {/* Common Issues */}
              {gap.commonIssues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Common Issues:</h4>
                  <ul className="text-sm space-y-1">
                    {gap.commonIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                <ul className="text-sm space-y-1">
                  {gap.recommendedActions.slice(0, 2).map((action, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}

        {gaps.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-medium text-green-700 mb-1">Excellent Compliance</h3>
            <p className="text-sm text-muted-foreground">
              No significant gaps identified across all compliance areas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};