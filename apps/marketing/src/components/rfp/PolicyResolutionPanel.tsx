import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PolicyResolutionResult, PolicyCheckStatus } from '@/types/rfp';

interface PolicyResolutionPanelProps {
  resolution?: PolicyResolutionResult;
  loading?: boolean;
  error?: string;
  onValidate?: () => void;
}

const getStatusIcon = (status: PolicyCheckStatus) => {
  switch (status) {
    case 'COMPLIANT':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'RESTRICTED':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'PENDING':
      return <Clock className="h-5 w-5 text-yellow-600" />;
  }
};

const getStatusBadge = (status: PolicyCheckStatus) => {
  const variants = {
    COMPLIANT: 'default',
    RESTRICTED: 'destructive',
    PENDING: 'outline'
  } as const;
  
  return (
    <Badge variant={variants[status]} className="ml-2">
      {status}
    </Badge>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

export function PolicyResolutionPanel({ 
  resolution, 
  loading, 
  error,
  onValidate 
}: PolicyResolutionPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Validating Tool Disclosures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Checking disclosed tools against policy requirements...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!resolution || !resolution.items || resolution.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Policy Compliance Check</CardTitle>
          <CardDescription>
            No tool disclosures have been validated yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onValidate && (
            <Button onClick={onValidate} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Validation
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const statusCounts = resolution.items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<PolicyCheckStatus, number>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Policy Compliance Resolution</span>
          {onValidate && (
            <Button onClick={onValidate} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-validate Tools
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Validation results for disclosed AI tools against policy requirements
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Overall Compliance Score
            </p>
            <p className={`text-3xl font-bold ${getScoreColor(resolution.overall_score)}`}>
              {resolution.overall_score}%
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="flex gap-4">
              <div>
                <span className="font-medium text-green-600">
                  {statusCounts.COMPLIANT || 0}
                </span>
                <span className="text-muted-foreground ml-1">Compliant</span>
              </div>
              <div>
                <span className="font-medium text-yellow-600">
                  {statusCounts.PENDING || 0}
                </span>
                <span className="text-muted-foreground ml-1">Pending</span>
              </div>
              <div>
                <span className="font-medium text-red-600">
                  {statusCounts.RESTRICTED || 0}
                </span>
                <span className="text-muted-foreground ml-1">Restricted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tool-by-Tool Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Tool-by-Tool Analysis
          </h3>
          
          {resolution.items.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            
            return (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.tool_name}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      {(item.version || item.provider) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.provider && `${item.provider} `}
                          {item.version && `v${item.version}`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pl-8 space-y-3">
                    {item.reasons.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Issues:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {item.reasons.map((reason, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {item.failed_controls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Failed Policy Controls:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.failed_controls.map((control, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {control}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.status === 'COMPLIANT' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          This tool meets all policy requirements and is approved for use.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
