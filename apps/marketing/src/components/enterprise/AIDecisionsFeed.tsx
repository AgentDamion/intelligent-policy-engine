import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bot, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { useAIDecisions } from '@/hooks/useAIDecisions';
import aiAgentIntegration from '@/services/aiAgentIntegration';

const AIDecisionsFeed: React.FC = () => {
  const { decisions, loading, refetch: fetchAIDecisions, isConnected } = useAIDecisions();

  const handleAnalyzeDocument = async () => {
    await aiAgentIntegration.analyzeDocument({
      type: 'test',
      content: 'Sample document for AI analysis testing',
      metadata: { source: 'test_button', timestamp: new Date().toISOString() }
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    if (outcome.includes('Approved') || outcome.includes('No violations')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (outcome.includes('Flagged') || outcome.includes('review')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Decision Feed
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} 
                   title={isConnected ? 'Connected' : 'Disconnected'} />
            </CardTitle>
            <CardDescription>
              Real-time decisions made by AI agents across your network
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyzeDocument}
              className="text-teal-600 hover:text-teal-700"
            >
              <Zap className="h-4 w-4" />
              Analyze Test Document
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAIDecisions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {decisions.length > 0 ? (
            decisions.map((decision) => (
              <div key={decision.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      {getOutcomeIcon(decision.outcome)}
                      <div>
                        <h4 className="font-medium text-sm">{decision.agent}</h4>
                        <p className="text-xs text-gray-600">{decision.action}</p>
                      </div>
                    </div>

                    {/* Details */}
                     <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Agency:</span>
                        <span className="ml-2 font-medium">{decision.agency || 'Unknown Agency'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Outcome:</span>
                        <span className="ml-2">{decision.outcome}</span>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    {decision.details?.reasoning && (
                      <div className="text-sm">
                        <span className="text-gray-600">AI Reasoning:</span>
                        <p className="text-gray-700 mt-1 italic">"{decision.details.reasoning}"</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {decision.details?.confidence && (
                        <>
                          <span>Confidence: {(decision.details.confidence * 100).toFixed(0)}%</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{new Date(decision.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  {decision.risk && (
                    <Badge className={getRiskColor(decision.risk)}>
                      {decision.risk} risk
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No AI decisions yet</p>
              <p className="text-sm">AI agents will appear here as they make decisions</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {decisions.length}
              </div>
              <div className="text-xs text-gray-600">Total Decisions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {decisions.filter(d => d.outcome.includes('Approved') || d.outcome.includes('No violations')).length}
              </div>
              <div className="text-xs text-gray-600">Auto-Approved</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {decisions.filter(d => d.outcome.includes('Flagged')).length}
              </div>
              <div className="text-xs text-gray-600">Flagged</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700">
                {decisions.length > 0 && decisions.some(d => d.details?.confidence) 
                  ? Math.round(decisions
                      .filter(d => d.details?.confidence)
                      .reduce((acc, d) => acc + (d.details?.confidence || 0), 0) / 
                      decisions.filter(d => d.details?.confidence).length * 100)
                  : 0}%
              </div>
              <div className="text-xs text-gray-600">Avg Confidence</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIDecisionsFeed;