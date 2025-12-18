import React, { useState } from 'react';
import { useComplianceDecisions } from '@/hooks/useComplianceDecisions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, AlertTriangle, CheckCircle, XCircle, Eye, Filter, Users } from 'lucide-react';
import { monitoring } from '@/utils/monitoring';
import { useNavigate } from 'react-router-dom';

export const SubmissionReviewQueue = () => {
  const { decisions, loading, error } = useComplianceDecisions();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  const filteredDecisions = decisions.filter(decision => {
    if (filterStatus === 'all') return true;
    return decision.status === filterStatus;
  });

  const getRiskBadgeColor = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 7) return 'bg-destructive text-destructive-foreground';
    if (score >= 4) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'under_review': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDaysPending = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleBulkAction = (action: string) => {
    monitoring.trackUserAction(`Bulk ${action}`, { 
      itemCount: selectedItems.length,
      items: selectedItems 
    });
    // TODO: Implement actual bulk action functionality
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredDecisions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredDecisions.map(d => d.id));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Submissions</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = decisions.filter(d => d.status === 'submitted' || d.status === 'under_review').length;
  const overdueCount = decisions.filter(d => getDaysPending(d.created_at) > 3).length;
  const avgReviewTime = 2.3; // Mock data - would calculate from historical data

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Review Queue</h1>
          <p className="text-muted-foreground">Enterprise submission intake and triage</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{avgReviewTime}d</div>
            <div className="text-sm text-muted-foreground">Avg Review</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedItems.length === filteredDecisions.length && filteredDecisions.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} of {filteredDecisions.length} selected
          </span>
          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Selected
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('request-info')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Info
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Submitted</SelectItem>
              <SelectItem value="risk">Risk Score</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredDecisions
            .filter(d => d.status === 'submitted')
            .map((decision) => (
              <Card key={decision.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedItems.includes(decision.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems([...selectedItems, decision.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== decision.id));
                          }
                        }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium">{decision.title}</h3>
                          {getStatusIcon(decision.status)}
                          <Badge variant="secondary" className={getRiskBadgeColor(decision.risk_score)}>
                            Risk: {decision.risk_score || 'N/A'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Submitted:</span>{' '}
                            {new Date(decision.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Days Pending:</span>{' '}
                            <span className={getDaysPending(decision.created_at) > 3 ? 'text-destructive font-medium' : ''}>
                              {getDaysPending(decision.created_at)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Tools:</span>{' '}
                            {decision.items.length} item{decision.items.length !== 1 ? 's' : ''}
                          </div>
                          <div>
                            <span className="font-medium">AI Recommendations:</span>{' '}
                            {decision.ai_recommendations.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Priority</div>
                        <Badge variant={decision.risk_score && decision.risk_score >= 7 ? 'destructive' : 'secondary'}>
                          {decision.risk_score && decision.risk_score >= 7 ? 'High' : 'Medium'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/decisions/${decision.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            monitoring.trackUserAction('Quick approve', { decisionId: decision.id });
                            // TODO: Implement quick approve functionality
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="under_review">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Under Review</h3>
            <p className="text-muted-foreground">Items currently being reviewed by team members</p>
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-4">
            {filteredDecisions
              .filter(d => d.status === 'approved')
              .map((decision) => (
                <Card key={decision.id} className="border-success/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{decision.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Approved on {decision.decided_at ? new Date(decision.decided_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <Badge variant="secondary" className="bg-success text-success-foreground">
                          Approved
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="space-y-4">
            {filteredDecisions
              .filter(d => d.status === 'rejected')
              .map((decision) => (
                <Card key={decision.id} className="border-destructive/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{decision.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Rejected on {decision.decided_at ? new Date(decision.decided_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <Badge variant="destructive">
                          Rejected
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};