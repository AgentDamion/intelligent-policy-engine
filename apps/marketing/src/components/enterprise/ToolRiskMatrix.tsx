import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { ToolRiskData } from '@/hooks/useToolIntelligence';
import { FeatureGate } from '@/components/FeatureGate';

interface ToolRiskMatrixProps {
  data: ToolRiskData[];
  loading?: boolean;
  enterpriseId?: string;
}

export const ToolRiskMatrix: React.FC<ToolRiskMatrixProps> = ({ data, loading, enterpriseId }) => {
  return (
    <FeatureGate 
      feature="tool_intelligence" 
      enterpriseId={enterpriseId}
      fallback={
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              Tool Risk Matrix (Premium)
            </CardTitle>
            <CardDescription>
              AI-powered risk assessment available in Enterprise tier and above
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <ToolRiskMatrixContent data={data} loading={loading} />
    </FeatureGate>
  );
};

const ToolRiskMatrixContent: React.FC<{ data: ToolRiskData[]; loading?: boolean }> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Tool Risk Matrix
          </CardTitle>
          <CardDescription>
            Risk assessment across all monitored tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <Shield className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Tool Risk Matrix
        </CardTitle>
        <CardDescription>
          Risk assessment across {data.length} monitored tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((tool) => (
            <div 
              key={tool.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{tool.toolName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {tool.vendor}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Used {tool.usageCount} times</span>
                  <span>Last used: {new Date(tool.lastUsed).toLocaleDateString()}</span>
                  {tool.vulnerabilities > 0 && (
                    <span className="text-red-600">
                      {tool.vulnerabilities} vulnerabilities
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-medium text-sm">
                    Risk Score: {tool.riskScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tool.complianceStatus}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getRiskColor(tool.riskLevel)} flex items-center gap-1`}
                >
                  {getRiskIcon(tool.riskLevel)}
                  {tool.riskLevel}
                </Badge>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tool data available. Start tracking AI tool usage to see risk analysis.
            </div>
          )}
          {data.length > 10 && (
            <div className="text-center pt-4 text-sm text-muted-foreground">
              Showing 10 of {data.length} tools. Export full report for complete analysis.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};