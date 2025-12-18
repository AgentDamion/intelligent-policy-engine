import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Users,
  TrendingUp,
  Shield,
  FileText,
  ArrowUpCircle,
  Download
} from 'lucide-react';
import { useAgencyAIDecisions, AgencyAIDecision } from '@/hooks/useAgencyAIDecisions';
import { useCursorAIIntegration } from '@/hooks/useCursorAIIntegration';

interface AgencyAIDecisionsFeedProps {
  selectedClientId?: string;
  className?: string;
}

const AgencyAIDecisionsFeed: React.FC<AgencyAIDecisionsFeedProps> = ({ 
  selectedClientId, 
  className = '' 
}) => {
  const { 
    decisions, 
    analytics, 
    loading, 
    refetch, 
    isConnected,
    escalateDecision,
    generateReport
  } = useAgencyAIDecisions({ 
    clientId: selectedClientId,
    includeAllClients: !selectedClientId 
  });

  const { analyzeClientPortfolio } = useCursorAIIntegration();
  const [activeTab, setActiveTab] = useState('all');

  const handleAnalyzePortfolio = async () => {
    await analyzeClientPortfolio(
      selectedClientId ? [selectedClientId] : ['all'], 
      'risk'
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeIcon = (decision: AgencyAIDecision) => {
    if (decision.outcome === 'approved') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (decision.outcome === 'flagged') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (decision.outcome === 'escalated') {
      return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  const getSLABadgeColor = (slaImpact: string) => {
    switch (slaImpact) {
      case 'critical':
        return 'destructive';
      case 'major':
        return 'secondary';
      case 'minor':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredDecisions = decisions.filter(decision => {
    switch (activeTab) {
      case 'cross-client':
        return decision.crossClientPattern;
      case 'sla-risk':
        return decision.slaImpact === 'critical' || decision.slaImpact === 'major';
      case 'high-risk':
        return decision.risk === 'high' || decision.risk === 'critical';
      default:
        return true;
    }
  });

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Agency AI Intelligence Hub
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} 
                     title={isConnected ? 'Connected' : 'Disconnected'} />
              </CardTitle>
              <CardDescription>
                AI-powered insights across your pharmaceutical client portfolio
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzePortfolio}
                className="text-primary hover:text-primary/90"
              >
                <Zap className="h-4 w-4" />
                Analyze Portfolio
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport()}
              >
                <Download className="h-4 w-4" />
                Generate Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Analytics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.totalDecisions}</div>
              <div className="text-sm text-muted-foreground">Total Decisions</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-warning">{analytics.crossClientRisks}</div>
              <div className="text-sm text-muted-foreground">Cross-Client Risks</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-destructive">{analytics.slaBreaches}</div>
              <div className="text-sm text-muted-foreground">SLA Risks</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-success">{analytics.autoResolved}</div>
              <div className="text-sm text-muted-foreground">Auto-Resolved</div>
            </div>
          </div>

          {/* Decision Feed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Decisions</TabsTrigger>
              <TabsTrigger value="cross-client">Cross-Client</TabsTrigger>
              <TabsTrigger value="sla-risk">SLA Risk</TabsTrigger>
              <TabsTrigger value="high-risk">High Risk</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="space-y-4">
                {filteredDecisions.length > 0 ? (
                  filteredDecisions.map((decision) => (
                    <div key={decision.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-3">
                            {getOutcomeIcon(decision)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{decision.agent}</h4>
                                {decision.crossClientPattern && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    Cross-Client
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{decision.action}</p>
                            </div>
                          </div>

                          {/* Client and Outcome */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Client:</span>
                              <span className="ml-2 font-medium">{decision.clientName || 'Multiple Clients'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Outcome:</span>
                              <span className="ml-2 capitalize">{decision.outcome}</span>
                            </div>
                          </div>

                          {/* AI Reasoning */}
                          {decision.details?.reasoning && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">AI Analysis:</span>
                              <p className="text-foreground mt-1 italic">"{decision.details.reasoning}"</p>
                            </div>
                          )}

                          {/* Additional Details for Cross-Client Patterns */}
                          {decision.crossClientPattern && decision.details?.conflictingClients && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Affected Clients:</span>
                              <div className="flex gap-1 mt-1">
                                {decision.details.conflictingClients.map((client: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {client}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {decision.agencyAction === 'escalate' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => escalateDecision(decision.id, 'Cross-client risk detected')}
                              >
                                <ArrowUpCircle className="h-3 w-3 mr-1" />
                                Escalate
                              </Button>
                            )}
                            {decision.agencyAction === 'generate_report' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => generateReport(decision.clientId)}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Generate Report
                              </Button>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                              {decision.details?.confidence && (
                                <>
                                  <span>Confidence: {(decision.details.confidence * 100).toFixed(0)}%</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{new Date(decision.created_at).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Risk and SLA Badges */}
                        <div className="flex flex-col gap-2">
                          {decision.risk && (
                            <Badge className={getRiskColor(decision.risk)}>
                              {decision.risk} risk
                            </Badge>
                          )}
                          {decision.slaImpact && decision.slaImpact !== 'none' && (
                            <Badge variant={getSLABadgeColor(decision.slaImpact)}>
                              SLA {decision.slaImpact}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">No AI decisions for this filter</p>
                    <p className="text-sm">AI agents will appear here as they analyze your client portfolio</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyAIDecisionsFeed;