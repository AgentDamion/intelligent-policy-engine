import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComplianceDecisions, ComplianceDecision } from '@/hooks/useComplianceDecisions';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DecisionReviewDashboard = ({ workspaceId }: { workspaceId?: string }) => {
  const { decisions, loading, error, refetch } = useComplianceDecisions(workspaceId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filteredDecisions = decisions.filter(decision => {
    if (statusFilter !== 'all' && decision.status !== statusFilter) return false;
    if (riskFilter !== 'all') {
      const risk = decision.risk_score || 0;
      if (riskFilter === 'low' && risk >= 30) return false;
      if (riskFilter === 'medium' && (risk < 30 || risk >= 70)) return false;
      if (riskFilter === 'high' && risk < 70) return false;
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'under_review': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score < 30) return 'Low';
    if (score < 70) return 'Medium';
    return 'High';
  };

  const getRiskColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score < 30) return 'bg-green-100 text-green-800';
    if (score < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Calculate agreement between AI and human decisions
  const calculateAgreement = (decision: ComplianceDecision) => {
    const aiRecommendations = decision.ai_recommendations;
    const humanDecisions = decision.human_decisions;
    
    if (!aiRecommendations.length || !humanDecisions.length) return null;
    
    const aiOutcome = aiRecommendations[0]?.outcome;
    const humanOutcome = humanDecisions[0]?.outcome;
    
    return aiOutcome === humanOutcome;
  };

  const stats = {
    total: filteredDecisions.length,
    approved: filteredDecisions.filter(d => d.status === 'approved').length,
    rejected: filteredDecisions.filter(d => d.status === 'rejected').length,
    pending: filteredDecisions.filter(d => d.status === 'under_review').length,
    agreement: filteredDecisions.filter(d => calculateAgreement(d) === true).length
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="w-12 h-12 mx-auto mb-4" />
            <p>Error loading decisions: {error}</p>
            <Button onClick={refetch} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Decisions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total > 0 ? Math.round((stats.agreement / stats.total) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">AI Agreement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Decision Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Decision List */}
          <div className="space-y-4">
            {filteredDecisions.map((decision) => {
              const agreement = calculateAgreement(decision);
              return (
                <Card key={decision.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{decision.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(decision.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(decision.status)}>
                          {getStatusIcon(decision.status)}
                          <span className="ml-1">{decision.status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge className={getRiskColor(decision.risk_score)}>
                          {getRiskLevel(decision.risk_score)} Risk
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* AI Recommendations */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">AI Recommendations</h4>
                        {decision.ai_recommendations.length > 0 ? (
                          decision.ai_recommendations.slice(0, 2).map((ai, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{ai.outcome}</Badge>
                                <span className="text-xs text-muted-foreground">{ai.agent}</span>
                              </div>
                              <p className="text-sm">{ai.action}</p>
                              {ai.risk && (
                                <Badge className={`mt-1 ${getRiskColor(parseInt(ai.risk))}`}>
                                  {ai.risk} Risk
                                </Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No AI recommendations</p>
                        )}
                      </div>

                      {/* Human Decisions */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">Human Decisions</h4>
                        {decision.human_decisions.length > 0 ? (
                          decision.human_decisions.slice(0, 2).map((human, idx) => (
                            <div key={idx} className="p-3 bg-green-50 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{human.outcome}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(human.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {human.conditions && (
                                <p className="text-sm mb-1">
                                  <strong>Conditions:</strong> {human.conditions}
                                </p>
                              )}
                              {human.feedback && (
                                <p className="text-sm text-muted-foreground">{human.feedback}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No human decisions</p>
                        )}
                      </div>

                      {/* Agreement Analysis */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">Agreement Analysis</h4>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          {agreement === null ? (
                            <p className="text-sm text-muted-foreground">Insufficient data</p>
                          ) : (
                            <div className="flex items-center gap-2">
                              {agreement ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium text-green-700">Agreement</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-700">Disagreement</span>
                                </>
                              )}
                            </div>
                          )}
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              {decision.items.length} AI tool{decision.items.length !== 1 ? 's' : ''} reviewed
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredDecisions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">No decisions match the current filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};