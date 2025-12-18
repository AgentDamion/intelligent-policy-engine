import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIDecisions } from '@/hooks/useAIDecisions';
import { Clock, Search, Download, Filter, Bot, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const AuditTrail = ({ enterpriseId }: { enterpriseId?: string }) => {
  const { decisions, loading, refetch } = useAIDecisions();
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<any>(null);

  const filteredDecisions = decisions.filter(decision => {
    if (agentFilter !== 'all' && decision.agent !== agentFilter) return false;
    if (outcomeFilter !== 'all' && decision.outcome !== outcomeFilter) return false;
    if (searchTerm && !decision.action.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const uniqueAgents = [...new Set(decisions.map(d => d.agent))];
  const uniqueOutcomes = [...new Set(decisions.map(d => d.outcome))];

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'approved':
      case 'allow':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
      case 'deny':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'flagged':
      case 'review':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'approved':
      case 'allow':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'deny':
        return 'bg-red-100 text-red-800';
      case 'flagged':
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk?: string) => {
    if (!risk) return 'bg-gray-100 text-gray-800';
    const riskLevel = risk.toLowerCase();
    if (riskLevel.includes('low')) return 'bg-green-100 text-green-800';
    if (riskLevel.includes('medium')) return 'bg-yellow-100 text-yellow-800';
    if (riskLevel.includes('high')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportAuditTrail = () => {
    const csvContent = [
      ['Timestamp', 'Agent', 'Action', 'Outcome', 'Risk', 'Details'].join(','),
      ...filteredDecisions.map(decision => [
        new Date(decision.created_at).toISOString(),
        decision.agent,
        `"${decision.action}"`,
        decision.outcome,
        decision.risk || '',
        `"${decision.details?.reasoning || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            AI Agent Audit Trail
            <Badge variant="outline" className="ml-auto">
              {filteredDecisions.length} Decisions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Agent Filter */}
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Outcome Filter */}
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {uniqueOutcomes.map(outcome => (
                  <SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Actions */}
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button onClick={exportAuditTrail} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Decision Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Decision Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredDecisions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">No audit records match the current filters</p>
                  </div>
                ) : (
                  filteredDecisions.map((decision) => (
                    <div
                      key={decision.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedDecision?.id === decision.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDecision(decision)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{decision.agent}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(decision.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{decision.action}</p>
                          <div className="flex items-center gap-2">
                            {getOutcomeIcon(decision.outcome)}
                            <Badge className={getOutcomeColor(decision.outcome)}>
                              {decision.outcome}
                            </Badge>
                            {decision.risk && (
                              <Badge className={getRiskColor(decision.risk)}>
                                {decision.risk}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Decision Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDecision ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Agent</h4>
                    <Badge variant="outline">{selectedDecision.agent}</Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Timestamp</h4>
                    <p className="text-sm">{new Date(selectedDecision.created_at).toLocaleString()}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Action</h4>
                    <p className="text-sm">{selectedDecision.action}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Outcome</h4>
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(selectedDecision.outcome)}
                      <Badge className={getOutcomeColor(selectedDecision.outcome)}>
                        {selectedDecision.outcome}
                      </Badge>
                    </div>
                  </div>

                  {selectedDecision.risk && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Risk Level</h4>
                      <Badge className={getRiskColor(selectedDecision.risk)}>
                        {selectedDecision.risk}
                      </Badge>
                    </div>
                  )}

                  {(selectedDecision.details?.reasoning || selectedDecision.details) && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Reasoning</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded border">
                        {selectedDecision.details?.reasoning || 'No reasoning provided'}
                      </p>
                    </div>
                  )}

                  {selectedDecision.details && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Technical Details</h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
                        {JSON.stringify(selectedDecision.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">Select a decision to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{decisions.length}</div>
            <p className="text-sm text-muted-foreground">Total Decisions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {decisions.filter(d => d.outcome.toLowerCase().includes('approved') || d.outcome.toLowerCase().includes('allow')).length}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {decisions.filter(d => d.outcome.toLowerCase().includes('rejected') || d.outcome.toLowerCase().includes('deny')).length}
            </div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {decisions.filter(d => d.outcome.toLowerCase().includes('flagged') || d.outcome.toLowerCase().includes('review')).length}
            </div>
            <p className="text-sm text-muted-foreground">Flagged</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};