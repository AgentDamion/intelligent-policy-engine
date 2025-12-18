import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PolicyConflict } from '@/hooks/useConflictDetection';

interface ConflictListProps {
  conflicts: PolicyConflict[];
  onUpdateStatus: (conflictId: string, status: PolicyConflict['resolution_status']) => void;
}

type FilterOption = 'all' | 'open' | 'in_progress' | 'resolved' | 'dismissed';
type SeverityFilter = 'all' | 'low' | 'medium' | 'high';

export const ConflictList: React.FC<ConflictListProps> = ({ conflicts, onUpdateStatus }) => {
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const filteredConflicts = conflicts.filter(conflict => {
    const statusMatch = statusFilter === 'all' || conflict.resolution_status === statusFilter;
    const severityMatch = severityFilter === 'all' || conflict.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const getStatusIcon = (status: PolicyConflict['resolution_status']) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-brand-orange" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-brand-green" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: PolicyConflict['resolution_status']) => {
    const variants = {
      open: 'destructive',
      in_progress: 'secondary',
      resolved: 'default',
      dismissed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: PolicyConflict['severity']) => {
    const colors = {
      low: 'bg-brand-green/10 text-brand-green border-brand-green/20',
      medium: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
      high: 'bg-destructive/10 text-destructive border-destructive/20'
    };

    return (
      <Badge variant="outline" className={colors[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getConflictTypeLabel = (type: string) => {
    const labels = {
      policy_overlap: 'Policy Overlap',
      timeline_conflict: 'Timeline Conflict',
      resource_allocation: 'Resource Allocation',
      compliance_gap: 'Compliance Gap',
      ai_tool_conflict: 'AI Tool Conflict'
    };
    return labels[type as keyof typeof labels] || type.replace('_', ' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Conflict Management
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(value: FilterOption) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={(value: SeverityFilter) => setSeverityFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredConflicts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conflicts found matching the selected filters.</p>
            </div>
          ) : (
            filteredConflicts.map((conflict) => (
              <div key={conflict.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(conflict.resolution_status)}
                      <h4 className="font-medium">{conflict.description}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Client:</span> {conflict.client_name}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {getConflictTypeLabel(conflict.conflict_type)}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(conflict.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(conflict.severity)}
                    {getStatusBadge(conflict.resolution_status)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {conflict.resolution_status === 'open' && (
                          <DropdownMenuItem 
                            onClick={() => onUpdateStatus(conflict.id, 'in_progress')}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Start Resolution
                          </DropdownMenuItem>
                        )}
                        {conflict.resolution_status === 'in_progress' && (
                          <DropdownMenuItem 
                            onClick={() => onUpdateStatus(conflict.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </DropdownMenuItem>
                        )}
                        {conflict.resolution_status !== 'dismissed' && (
                          <DropdownMenuItem 
                            onClick={() => onUpdateStatus(conflict.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Dismiss
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {conflict.resolved_at && (
                  <div className="text-xs text-brand-green">
                    Resolved on {formatDate(conflict.resolved_at)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};